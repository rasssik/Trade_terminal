var gulp = require('gulp'),
	gutil = require('gulp-util'),
	sass = require('gulp-sass'),
	browserSync = require('browser-sync'),
	concat = require('gulp-concat'),
	uglify = require('gulp-uglify'),
	cleanCSS = require('gulp-clean-css'),
	rename = require('gulp-rename'),
	del = require('del'),
	imagemin = require('gulp-imagemin'),
	cache = require('gulp-cache'),
	autoprefixer = require('gulp-autoprefixer'),
	ftp = require('vinyl-ftp'),
	notify = require("gulp-notify"),
	fileinclude = require('gulp-file-include'),
	sftp = require('gulp-sftp'),

	rigger = require('gulp-rigger');

rsync = require('gulp-rsync');

// Пользовательские скрипты проекта

gulp.task('common-js', function () {
	return gulp.src([
			'app/js/common.js',
		])
		.pipe(concat('common.min.js'))
		.pipe(uglify())
		.pipe(gulp.dest('app/js'));
});


gulp.task('js', ['common-js'], function () {
	return gulp.src([
			'app/libs/jquery/dist/jquery.min.js',
			'app/libs/jquery.nice-select.js',
			'app/libs/lightslider.js',
			'app/libs/jquery.mCustomScrollbar.js',
			'app/libs/jquery.magnific-popup.js',
			'app/libs/modernizr.js.js',
			'app/libs/flexibility.js',
			'app/libs/jquery.maskedinput.js',
			'app/js/common.min.js', // Всегда в конце
		])
		.pipe(concat('scripts.min.js'))
		// .pipe(uglify()) // Минимизировать весь js (на выбор)
		.pipe(gulp.dest('app/js'))
		.pipe(browserSync.reload({
			stream: true
		}));
});

gulp.task('browser-sync', function () {
	browserSync({
		server: {
			baseDir: 'app'
		},
		notify: false,
		// tunnel: true,
		// tunnel: "projectmane", //Demonstration page: http://projectmane.localtunnel.me
	});
});
// Compile all HTML from templates and includes
gulp.task('html-build', function () {
	return gulp.src('./app/templates/*.html')
		.pipe(fileinclude({
			prefix: '@@',
			basepath: './app/templates/'
		}))
		.pipe(rename({
			extname: ''
		}))
		.pipe(rename({
			extname: '.html'
		}))
		.pipe(gulp.dest('./app'))
		.pipe(browserSync.reload({
			stream: true
		}));
});
gulp.task('html-watch', ['html-build'], function (done) {
	browserSync.reload();

	done();
});

// !!!!!!!
gulp.task('sass', function () {
	return gulp.src('app/sass/**/*.scss')
		.pipe(sass({
			outputStyle: 'expand'
		}).on("error", notify.onError()))
		.pipe(rename({
			suffix: '.min',
			prefix: ''
		}))
		.pipe(autoprefixer(['last 15 versions']))
		.pipe(cleanCSS()) // Опционально, закомментировать при отладке
		.pipe(gulp.dest('app/css'))
		.pipe(browserSync.reload({
			stream: true
		}));
});

gulp.task('watch', ['html-build', 'sass', 'js', 'browser-sync'], function () {
	gulp.watch('app/sass/**/*.scss', ['sass']);
	gulp.watch('./app/**/*.html', ['html-watch']);

	gulp.watch(['libs/**/*.js', 'app/js/common.js'], ['js']);
	gulp.watch('app/**/*.html', browserSync.reload);
});

gulp.task('imagemin', function () {
	return gulp.src('app/img/**/*')
		.pipe(cache(imagemin()))
		.pipe(gulp.dest('dist/img'));
});

gulp.task('build', ['removedist', 'imagemin', 'sass', 'js'], function () {

	var buildFiles = gulp.src([
		'app/*.html',
		'app/.htaccess',
	]).pipe(gulp.dest('dist'));

	var buildCss = gulp.src([
		'app/css/main.min.css',
	]).pipe(gulp.dest('dist/css'));

	var buildJs = gulp.src([
		'app/js/scripts.min.js',
	]).pipe(gulp.dest('dist/js'));

	var buildFonts = gulp.src([
		'app/fonts/**/*',
	]).pipe(gulp.dest('dist/fonts'));

});

gulp.task('deploy', function () {

	var conn = ftp.create({
		host: '89.108.105.109',
		user: 'username',
		password: 'userpassword',
		parallel: 10,
		log: gutil.log
	});

	var globs = [
		'dist/**',
		'dist/.htaccess',
	];
	return gulp.src(globs, {
			buffer: false
		})
		.pipe(conn.dest('/path/to/folder/on/server'));

});

// gulp.task('rsync', function() {
//   return gulp.src('dist/**')
//     .pipe(rsync({
//       root: 'dist/',
//       hostname: 'some',
//       destination: 'some',
//       // include: ['*.htaccess'], // Скрытые файлы, которые необходимо включить в деплой
//       recursive: true,
//       archive: true,
//       silent: false,
//       compress: true
//     }));
// });

// ======== sftp ===================
// gulp.task('rsync', function () {
// 	return gulp.src('dist/**')
// 		.pipe(sftp({
// 			host: 'some,
// 			user: 'some',
// 			pass: 'some',
// 			port: 21,
// 			remotePath: '/mc'
// 		}));
// });
// ======== END:sftp ===================
gulp.task('removedist', function () {
	return del.sync('dist');
});
gulp.task('clearcache', function () {
	return cache.clearAll();
});

gulp.task('default', ['watch']);