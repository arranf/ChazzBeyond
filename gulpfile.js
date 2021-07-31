const { series, parallel, src, dest, watch } = require('gulp');

const gulp = require('gulp');
const gulpClean = require('gulp-clean');
const cleanhtml = require('gulp-cleanhtml');
const minifycss = require('gulp-minify-css');
const gulpZip = require('gulp-zip');
const babel = require('gulp-babel');
const sourcemaps = require('gulp-sourcemaps');

// Clean build directory
function clean() {
    return src('build/*', { read: false }).pipe(gulpClean());
}

// Copy static folders to build directory
function copy() {
    src('src/icons//**.png').pipe(dest('build/icons'));
    return src('src/manifest.json').pipe(dest('build'));
}

// Copy and compress HTML files
function html() {
    return gulp.src('src/html//*.html').pipe(cleanhtml()).pipe(dest('build'));
}

// Copy vendor scripts and uglify all other scripts, creating source maps
function js() {
    return (
        src('src/js//*.js')
            .pipe(sourcemaps.init())
            .pipe(
                babel({
                    presets: ['@babel/preset-env'],
                })
            )
            // .pipe(minify())
            .pipe(sourcemaps.write())
            .pipe(dest('build/js'))
    );
}

// Minify styles
function css() {
    return src('src/css//*.css')
        .pipe(minifycss({ root: 'src/css', keepSpecialComments: 0 }))
        .pipe(dest('build/css'));
}

// Build ditributable and sourcemaps after other tasks completed
function zip() {
    // eslint-disable-next-line global-require
    const manifest = require('./src/manifest');
    const distFileName = `${manifest.name} v${manifest.version}.zip`;
    return src('build/**').pipe(gulpZip(distFileName)).pipe(dest('build'));
}

exports.build = series(clean, parallel(html, js, css, copy), zip);
exports.default = () => {
    watch('src/css/*.css', { ignoreInitial: false }, css);
    watch('src/html/*.html', { ignoreInitial: false }, html);
    watch('src/js/*.js', { ignoreInitial: false }, js);
    watch(
        ['src/icons/*.*', 'src/manifest.json'],
        { ignoreInitial: false },
        copy
    );
};
