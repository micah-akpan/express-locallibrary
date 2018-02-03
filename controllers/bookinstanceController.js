var BookInstance = require('../models/bookinstance');
const { body, validationResult } = require('express-validator/check');
const { sanitizeBody } = require('express-validator/filter');
var Book = require('../models/book');

var async = require('async');

// Display list of all BookInstances.
exports.bookinstance_list = function(req, res) {
    
    BookInstance.find()
      .populate('book')
      .exec(function(err, list_bookinstances) {
          if (err) { return next(err); }

          // Successful, so render
          res.render('bookinstance_list', { title: 'Book Instance List', bookinstance_list: list_bookinstances });
      });
};

// Display detail page for a specific BookInstance.
exports.bookinstance_detail = function(req, res) {
   
    BookInstance.findById(req.params.id)
    .populate('book')
    .exec(function(err, bookinstance) {
        if (err) { return next(err); }
        if (bookinstance == null) {
            // no results
            var err = new Error('Book copy not found');
            err.status = 404;
            return next(err);
        }

        // Successful, so render.
        res.render('bookinstance_detail', { title: 'Book:', bookinstance: bookinstance });
    })
};

// Display BookInstance create form on GET.
exports.bookinstance_create_get = function(req, res) {
    
    Book.find({}, 'title')
    .exec(function (err, books) {
        if (err) { return next(err); }

        // Successful, so render.
        res.render('bookinstance_form', { title: 'Create BookInstance', book_list: books });
    });
};

// Handle BookInstance create on POST.
exports.bookinstance_create_post = [
    
    // Validate fields.
    body('book', 'Book must be specified').isLength({ min: 1 }).trim(),
    body('imprint', 'Imprint must be specified').isLength({ min: 1 }).trim(),
    body('due_back', 'Invalid date').optional({ checkFalsy: true }).isISO8601(),

    // Sanitize fields.
    sanitizeBody('book').trim().escape(),
    sanitizeBody('imprint').trim().escape(),
    sanitizeBody('status').trim().escape(),
    sanitizeBody('due_back').toDate(),


    // Process request after validation and sanitization.
    (req, res, next) => {

        // Extract the validation errors from the request.
        const errors = validationResult(req);

        // Create a BookInstance object with escaped and trimmed data.
        var bookInstance = new BookInstance(
            { book: req.body.book,
              imprint: req.body.imprint,
              status: req.body.status,
              due_back: req.body.due_back
            }
        );

        if (!errors.isEmpty()) {
            // There are errors. Render form again with sanitized values and error messages.
            Book.find({}, 'title')
                .exec(function(err, books) {
                    if (err) { return next(err); }
                    // Successful, so render
                    res.render('bookinstance_form', { title: 'Create BookInstance', book_list: books, selected_book: bookinstance.book._id, errors: errors.array(), bookinstance: bookinstance });
                });

                return;
        }
        else {
            // Data from form is valid
            bookInstance.save(function(err) {
                if (err) { return next(err); }
                // Successful - redirect to new record.
                res.redirect(bookInstance.url);
            });
        }
    }
];

// Display BookInstance delete form on GET.
exports.bookinstance_delete_get = function(req, res) {
    // find the bookinstance with the given id
    BookInstance
    .findById(req.params.id)
    .exec(function(err, result) {
        if (err) { return next(err); }

        res.render('bookinstance_delete', { title: 'Delete BookInstance', bookinstance: result });
    });
};

// Handle BookInstance delete on POST.
exports.bookinstance_delete_post = function(req, res) {
    // get the bookinstance by the body data (bookinstanceid)
    BookInstance.findById(req.body.bookinstanceid, function(err, result) {
        if (err) { return next(err); }

        BookInstance
        .findByIdAndRemove(req.body.bookinstanceid, function(err) {
            if (err) { return next(err); }
            res.redirect('/catalog/bookinstances')
        });
    })
};

// Display BookInstance update form on GET.
exports.bookinstance_update_get = function(req, res) {
    // get the bookinstance with the given id
    async.parallel({
        book_list: function(callback) {
            Book.find({}, 'title').exec(callback)
        },

        bookinstance: function(callback) {
            BookInstance.findById(req.params.id).exec(callback);
        }
    }, function(err, results) {
        if (err) { return next(err); }
        
        if (results.bookinstance == null) {
            // no bookinstances
            var err = new Error('Bookinstance not found');
            err.status = 404;
            return next(err);
        }

        // console.log(results.bookinstance.book.toString())
        // console.log(results.book_list)

        res.render('bookinstance_form', { title: 'Update BookInstance', book_list: results.book_list, bookinstance: results.bookinstance });
    })
};

// Handle bookinstance update on POST.
exports.bookinstance_update_post = [

     // Validate fields.
     body('book', 'Book must be specified').isLength({ min: 1 }).trim(),
     body('imprint', 'Imprint must be specified').isLength({ min: 1 }).trim(),
     body('due_back', 'Invalid date').optional({ checkFalsy: true }).isISO8601(),
 
     // Sanitize fields.
     sanitizeBody('book').trim().escape(),
     sanitizeBody('imprint').trim().escape(),
     sanitizeBody('status').trim().escape(),
     sanitizeBody('due_back').toDate(),


     // process request after validation and sanitization.
     (req, res, next) => {

        // Extract the validation errors from a request.
        const errors = validationResult(req);

        var bookinstance = new BookInstance({
            book: req.body.book,
            imprint: req.body.imprint,
            status: req.body.status,
            due_back: req.body.due_back,
            _id: req.params.id
        });

        if (!errors.isEmpty()) {

            // Re-render form
            async.parallel({
                book_list: function(callback) {
                    Book.find({}, 'title').exec(callback)
                },
        
                bookinstance: function(callback) {
                    BookInstance.findById(req.params.id).exec(callback);
                }
            }, function(err, results) {
                if (err) { return next(err); }
        
                // console.log(results.bookinstance.book.toString())
                // console.log(results.book_list)
        
                res.render('bookinstance_form', { title: 'Update BookInstance', book_list: results.book_list, bookinstance: results.bookinstance, errors: errors.array() });
            })

            return;
        }

        // No errors, Update record
        BookInstance.findByIdAndUpdate(req.params.id, bookinstance, {}, function(err, theinstance) {
            if (err) { return next(err); }

            res.redirect(theinstance.url);
        });
    }
];