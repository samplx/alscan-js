/* vim: set expandtab tabstop=4 shiftwidth=4 softtabstop=4 fileencoding=utf-8 : */
/*
 *     Copyright 2018 James Burlingame
 *
 *     Licensed under the Apache License, Version 2.0 (the "License");
 *     you may not use this file except in compliance with the License.
 *     You may obtain a copy of the License at
 *
 *         http://www.apache.org/licenses/LICENSE-2.0
 *
 *     Unless required by applicable law or agreed to in writing, software
 *     distributed under the License is distributed on an "AS IS" BASIS,
 *     WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *     See the License for the specific language governing permissions and
 *     limitations under the License.
 *
 */

// enable JavaScript strict mode.
'use strict';

const gulp = require('gulp');
const eslint= require('gulp-eslint');
const jest = require('gulp-jest').default;

const eslintConfig = (base) => {
    base = base || 'eslint:recommended';
    return {
        env: {
            node: true,
            commonjs: true,
            es: true
        },
        extends: base,
        rules: {
            indent: [ 'error', 4 ],
            'linebreak-style': [ 'error', 'unix' ],
            quotes: [ 'error', 'single' ],
            semi: [ 'error', 'always' ],
            'no-console': 'off'
        }
    };
};

const jestConfig = () => {
    return {

    };
};

const coverageConfig = () => {
    return {
        collectCoverage: true,
        coverageReporters: [ 'json', 'lcov', 'html', 'text']
    };
};

gulp.task('test', () => {
    return gulp.src('__tests__')
        .pipe(jest(jestConfig()));
});

gulp.task('coverage', () => {
    return gulp.src('__tests__')
        .pipe(jest(coverageConfig()));
});

gulp.task('lint', () => {
    return gulp.src('./lib/*.js', './__tests__/*.js', './__mocks__/*.js')
        .pipe(eslint(eslintConfig()))
        .pipe(eslint.format())
        .pipe(eslint.failAfterError());
});

gulp.task('pedantic', () => {
    return gulp.src('./lib/*.js', './__tests__/*.js', './__mocks__/*.js')
        .pipe(eslint(eslintConfig('eslint:all')))
        .pipe(eslint.format())
        .pipe(eslint.failAfterError());
});

gulp.task('default', gulp.series(['lint', 'test']));
