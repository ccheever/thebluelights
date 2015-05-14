var gulp = require('gulp');
var babel = require('@exponent/gulp-babel');
babel.task(gulp);
gulp.task('default', ['babel-watch']);
