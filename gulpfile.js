const gulp = require('gulp');
const clean = require('gulp-clean');
const cleanhtml = require('gulp-cleanhtml');
const minifycss = require('gulp-minify-css');
const zip = require('gulp-zip');
const babel = require('gulp-babel');
const minify = require('gulp-babel-minify');
const eslint = require('gulp-eslint');

// Clean build directory
gulp.task('clean', () => {
    return gulp.src('build/*', { read: false }).pipe(clean());
});

// Copy static folders to build directory
gulp.task('copy', () => {
    gulp.src('src/icons//**.png').pipe(gulp.dest('build/icons'));
    return gulp.src('src/manifest.json').pipe(gulp.dest('build'));
});

// Copy and compress HTML files
gulp.task('html', () => {
    return gulp
        .src('src/html//*.html')
        .pipe(cleanhtml())
        .pipe(gulp.dest('build'));
});

// Copy vendor scripts and uglify all other scripts, creating source maps
gulp.task('js', () => {
    return gulp
        .src('src/js//*.js')
        .pipe(
            babel({
                presets: ['@babel/preset-env'],
            })
        )
        .pipe(
            minify({
                mangle: {
                    keepClassName: true,
                },
            })
        )
        .pipe(gulp.dest('build/js'));
});

// Minify styles
gulp.task('css', () => {
    return gulp
        .src('src/css//*.css')
        .pipe(minifycss({ root: 'src/css', keepSpecialComments: 0 }))
        .pipe(gulp.dest('build/css'));
});

// Build ditributable and sourcemaps after other tasks completed
gulp.task('zip', () => {
    // eslint-disable-next-line global-require
    const manifest = require('./src/manifest');
    const distFileName = `${manifest.name} v${manifest.version}.zip`;
    return gulp.src('build/').pipe(zip(distFileName)).pipe(gulp.dest('build'));
});

gulp.task(
    'default',
    gulp.series('clean', gulp.parallel('html', 'js', 'css', 'copy'), 'zip'),
    () => {
        gulp.watch(['./src/css//*.css'], ['css']);
        gulp.watch(['./src/js//*.js'], ['js']);
        gulp.watch(['./src/html//*.html'], ['html']);
    }
);
