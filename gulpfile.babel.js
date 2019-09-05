import { series, parallel, task, src, dest, watch } from 'gulp';
import plumber from 'gulp-plumber';
import sass from 'gulp-sass';
import autoprefixer from 'gulp-autoprefixer';
import rigger from 'gulp-rigger';
import notify from 'gulp-notify';
import bs from 'browser-sync';
import babel from 'gulp-babel';
import uglifyJS from 'gulp-minify';
import cleanCSS from 'gulp-clean-css';
import minifyImage from 'gulp-imagemin';
import gutil from 'gulp-util';
import changed from 'gulp-changed';

const SOURCE_RELATIVE_PATH = './src';
const DIST_RELATIVE_PATH = './public';
const SASS_EXTENSION = 'scss';
const browserSync = bs.create();
const PORT = gutil.env.p || 8080;
const PRODUCTION = gutil.env.production;

task('html', () => (
	src(`${SOURCE_RELATIVE_PATH}/*.html`)
		.pipe(changed(DIST_RELATIVE_PATH))
		.pipe(dest(DIST_RELATIVE_PATH))
		.pipe(browserSync.stream())
));

task('css', () => (
	src(`${SOURCE_RELATIVE_PATH}/styles/**/*.css`)
    .pipe(changed(`${DIST_RELATIVE_PATH}/styles/`))
		.pipe(plumber())
		.pipe(autoprefixer('> 1%', 'last 5 versions', 'Firefox < 20', 'ie 8', 'ie 9'))
		.pipe(PRODUCTION ? cleanCSS({compatibility: 'ie8'}) : gutil.noop())
		.pipe(dest(`${DIST_RELATIVE_PATH}/styles/`))
		.pipe(browserSync.stream())
));

task('sass', () => (
	src([
			`!${SOURCE_RELATIVE_PATH}/styles/fonts.${SASS_EXTENSION}`,
			`!${SOURCE_RELATIVE_PATH}/styles/mixins.${SASS_EXTENSION}`,
			`${SOURCE_RELATIVE_PATH}/styles/**/*.${SASS_EXTENSION}`
		])
    .pipe(changed(`${DIST_RELATIVE_PATH}/styles/`, { extension: `.${SASS_EXTENSION}` }))
		.pipe(plumber({errorHandler: notify.onError('Error: <%= error.message %>')}))
		.pipe(sass())
		.pipe(autoprefixer('> 1%', 'last 5 versions', 'Firefox < 20', 'ie 8', 'ie 9'))
		.pipe(PRODUCTION ? cleanCSS({compatibility: 'ie8'}) : gutil.noop())
		.pipe(dest(`${DIST_RELATIVE_PATH}/styles/`))
    .pipe(browserSync.stream())
));

task('jsLibs', () => (
	src(`${SOURCE_RELATIVE_PATH}/scripts/libs/**/*.js`)
    .pipe(changed(`${DIST_RELATIVE_PATH}/js/libs/`))
		.pipe(plumber())
		.pipe(rigger())
		.pipe(PRODUCTION ? uglifyJS({
			ext: {
				min: '.js',
			},
			noSource: true,
		}) : gutil.noop())
		.pipe(dest(`${DIST_RELATIVE_PATH}/js/libs/`))
));

task('js', series('jsLibs', () => (
	src([
			`!${SOURCE_RELATIVE_PATH}/scripts/libs/**/*.js`,
			`${SOURCE_RELATIVE_PATH}/scripts/**/*.js`
		])
    .pipe(changed(`${DIST_RELATIVE_PATH}/js/`))
		.pipe(plumber())
		.pipe(rigger())
		.pipe(babel())
		.pipe(PRODUCTION ? uglifyJS({
			ext: {
				min: '.js',
			},
			noSource: true,
		}) : gutil.noop())
		.pipe(dest(`${DIST_RELATIVE_PATH}/js/`))
)));

task('media', () => (
	src([
			`!${SOURCE_RELATIVE_PATH}/assets/i/**/*.*`,
			`${SOURCE_RELATIVE_PATH}/assets/**/*.*`
		])
		.pipe(dest(`${DIST_RELATIVE_PATH}/assets/`))
));

task('img', () => (
	src(`${SOURCE_RELATIVE_PATH}/assets/i/**/*.*`)
    .pipe(changed(`${DIST_RELATIVE_PATH}/assets/i/`))
		.pipe(PRODUCTION ? minifyImage() : gutil.noop())
		.pipe(dest(`${DIST_RELATIVE_PATH}/assets/i/`))
));

task('browserSync', () => (
	browserSync.init(null, {
		baseDir: `/${DIST_RELATIVE_PATH}/`,
		port: PORT,
		files: [ `/${DIST_RELATIVE_PATH}/**/*.*` ],
		server: {
			baseDir: `${DIST_RELATIVE_PATH}`,
			index: 'index.html'
		},
	})
));

function reloadBrowsers(done) {
	browserSync.reload();

	done();
}

task('watch', (done) => {
	watch(`${SOURCE_RELATIVE_PATH}/*.html`, series('html', reloadBrowsers));
	watch(`${SOURCE_RELATIVE_PATH}/styles/**/*.css`, series('css'));
	watch(`${SOURCE_RELATIVE_PATH}/styles/**/*.${SASS_EXTENSION}`, series('sass'));
	watch(`${SOURCE_RELATIVE_PATH}/scripts/**/*.js`, series('js'));

	done();
});

task('default', parallel(
	'html',
	'css',
	'sass',
	'js',
	'media',
	'img',
	'browserSync',
	'watch'
));
