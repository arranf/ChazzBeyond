const gulp = require('gulp'),
	clean = require('gulp-clean'),
	cleanhtml = require('gulp-cleanhtml'),
	minifycss = require('gulp-minify-css'),
	zip = require('gulp-zip'),
	babel = require('gulp-babel'),
	minify = require('gulp-babel-minify');


//clean build directory
gulp.task('clean', function () {
	return gulp.src('build/*', { read: false })
		.pipe(clean());
});

//copy static folders to build directory
gulp.task('copy', function () {
	gulp.src('src/icons//**.png')
		.pipe(gulp.dest('build/icons'));
	return gulp.src('src/manifest.json')
		.pipe(gulp.dest('build'));
});

//copy and compress HTML files
gulp.task('html', function () {
	return gulp.src('src/html//*.html')
		.pipe(cleanhtml())
		.pipe(gulp.dest('build'));
});

//copy vendor scripts and uglify all other scripts, creating source maps
gulp.task('js', () => {
	return gulp.src("src/js///*.js")
		.pipe(babel({
			presets: ['@babel/preset-env']
		}))
		.pipe(minify({
			mangle: {
				keepClassName: true
			}
		}))
		.pipe(gulp.dest("build/js"));
});

//minify styles
gulp.task('css', function () {
	return gulp.src('src/css//*.css')
		.pipe(minifycss({ root: 'src/css', keepSpecialComments: 0 }))
		.pipe(gulp.dest('build/css'));
});

//build ditributable and sourcemaps after other tasks completed
gulp.task('zip', gulp.series('html', 'js', 'css', 'copy', () => {
	const manifest = require('./src/manifest'),
		distFileName = manifest.name + ' v' + manifest.version + '.zip',
		mapFileName = manifest.name + ' v' + manifest.version + '-maps.zip';
	//collect all source maps
	gulp.src('build/scripts//*.map')
		.pipe(zip(mapFileName))
		.pipe(gulp.dest('build'));
	//build distributable extension
	return gulp.src(['build/', '!build/scripts/**/*.map'])
		.pipe(zip(distFileName))
		.pipe(gulp.dest('build'));
}));


+ gulp.task('default', gulp.series('clean', 'zip'), () => {
	gulp.watch(['./src/css/**/*.css'], ['css']);
	gulp.watch(['./src/js/**/*.mjs'], ['js']);
	gulp.watch(['./src/html/**/*.html'], ['html']);
});