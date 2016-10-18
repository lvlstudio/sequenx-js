var gulp = require("gulp");

var $ = require('gulp-load-plugins')({
    rename: { "gulp-typescript": "ts" }
});

var merge2 = require('merge2');
var reverse = require('reversible');
var sync = require('gulp-sync')(gulp).sync;

var sourcemaps = require('gulp-sourcemaps');

gulp.task("typedoc", function() {
    return gulp
        .src(["src/**/*.ts", "typings/**/*.ts"])
        .pipe($.typedoc({
            target: "es5",
            mode: "file",
            out: "./doc/temp/",
            excludePrivate: true,
            name: "sequenx.js",
            //theme: "node_modules/typedoc-markdown-theme/bin",
            theme: "tools/doc_themes",
        }));
});

gulp.task("doc", ["typedoc"], function() {
    var r = gulp
        .src(["doc/temp/**/*.html"])
        .pipe($.extReplace('.md'))
        .pipe($.rename(function(path) {
            path.dirname = "";
            if (path.basename.charAt(0) == "_")
                path.basename = path.basename.substr(1);
        }))
        //.pipe($.replace(/example[\n]([a-zA-Z0-9\n\s/\.()=>{},]*)\n\${br}/gm, "<pre>${br}${br}#### Example${br}```javascript${br}$1${br}```${br}${br}</pre>"))
        //.pipe($.replace(/\n/g, ""))
        .pipe($.replace(/\${br}\n/g, "\n"))
        .pipe($.replace(/\${br}/g, "\n"))
        .pipe($.replace(/\(.*\//g,"("))
        .pipe($.replace(/\.html\)/g,")"))
        .pipe($.replace(/\* Defined.*/g,""))
        .pipe(gulp.dest('doc/md'));
    return merge2(r);
});

var tsProjectDebug = $.ts.createProject({
    outFile: "sequenx.js",
    declaration: true,
    sourceMap: true,
    target: "ES5"
});

var tsProject = $.ts.createProject({
    outFile: "sequenx.js",
    declaration: true,
    target: "ES5"
});

var tsProjectFull = $.ts.createProject({
    outFile: "sequenx.full.js",
    declaration: true,
    target: "ES5"
});

gulp.task("build.debug", () => {
    return gulp.src(["src/nodejs.js", 'src/**/*.ts', "typings/*.d.ts"])
        .pipe($.sourcemaps.init())
        .pipe($.if("**/*.ts", tsProjectDebug()))
        .pipe(reverse({ objectMode: true }))
        .pipe($.if("**/*.js", $.concat('sequenx.js')))
        .pipe($.sourcemaps.write())
        .pipe(gulp.dest("js/"));
});

gulp.task("build.release", () => {
    return gulp.src(["src/nodejs.js", 'src/sequencing/**/*.ts', "typings/*.d.ts"])
        .pipe($.if("**/*.ts", tsProject()))
        .pipe(reverse({ objectMode: true }))
        .pipe($.if("**/*.js", $.concat('sequenx.js')))
        .pipe(gulp.dest("dist/"));
});


gulp.task("build.release.full", () => {
    return gulp.src(["src/nodejs.js", 'src/**/*.ts', "typings/*.d.ts"])
        .pipe($.if("**/*.ts", tsProjectFull()))
        .pipe(reverse({ objectMode: true }))
        .pipe($.if("**/*.js", $.concat('sequenx.full.js')))
        .pipe(gulp.dest("dist/"));
});

gulp.task("minify", () => {
    return gulp.src(['dist/sequenx.js', 'dist/sequenx.full.js'])
        .pipe($.uglify())
        .pipe($.rename(path => path.basename += ".min"))
        .pipe(gulp.dest("dist/"));
});

gulp.task('pre-test', function() {
    return gulp.src(['js/*.js'])
        .pipe($.istanbul())
        .pipe($.istanbul.hookRequire());
});

gulp.task('test', ['pre-test'], function() {
    return gulp.src(['test/*.js'])
        .pipe($.mocha({ reporter: 'nyan' }))
        .pipe($.istanbul.writeReports())
        .pipe($.istanbul.enforceThresholds({ thresholds: { global: 70 } }));
});

gulp.task("release", sync([["build.release.full", "build.release"], "minify"]));
gulp.task("debug", ["build.debug"]);