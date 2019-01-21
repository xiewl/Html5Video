const gulp = require('gulp');
const babel = require('gulp-babel');
const minify = require('gulp-minify');

let cleanCSS = require('gulp-clean-css');
const rename = require("gulp-rename");
const del = require("del");

gulp.task('js', () =>
    gulp.src('src/js/Html5Video.js')
        .pipe(babel({
            presets: ['@babel/env']
        }))
        .pipe(minify({
            ext: {
                min: '.min.js'
            },
            noSource: true
        }))
        .pipe(gulp.dest('dist'))
);

gulp.task('css', () =>
    gulp.src('src/css/Html5Video.css')
        .pipe(cleanCSS())
        .pipe(rename({suffix: '.min'}))
        .pipe(gulp.dest('dist'))
);

gulp.task('del', ()=>{
    return del(['dist/']);
});

gulp.task('default', gulp.series('del', 'js', 'css'));