var gulp = require('gulp'),
    jade = require('gulp-jade');

var path = {
    jade: ['views/*.jade'],
    html: 'public/html'
};

gulp.task('jade-to-html', function() {
    return gulp.src(path.jade)
    .pipe(jade({
        pretty: true
    }))
    .pipe(gulp.dest(path.html))
});

