const {src, dest, task, parallel} = require("gulp");
const fs = require('fs-extra')
const path = require('path')
const gulpLess = require('gulp-less')
const replace = require('gulp-replace')
const gulpTs = require('gulp-typescript')
const tsConfig = require('./tsconfig.json')
const babel = require('gulp-babel');
const getGulpBabelConfig = require("./scripts/getGulpBabelConfig");
const buildPackage = require("./scripts/buildPackage");

// ~@study/style/esm/mixins/index.less
async function compileLess(isEsm){
	const targetDict = isEsm ? 'esm/style' : 'cjs/style'
	return src(['src/style/index.less']).pipe(replace(/(@import\s)['"]~@study\/style\/([^'"]+)['"]/g, '$1\'../../packages/style/$2\'')).pipe(gulpLess({
		javascriptEnabled: true
	})).pipe(dest(targetDict))
}

async function copyLess(isEsm){
	const targetDict = isEsm ? 'esm/style' : 'cjs/style'
	return src('src/style/*.less').pipe(dest(targetDict))
}

/**
 * 编译 style 下 index.tsx
 * import '@study/style/esm/index.less'
 */
async function compileStyle(isEsm){
	const targetDict = isEsm ? 'esm/style' : 'cjs/style'
	if(isEsm) {
		return src(['src/style/*.tsx', 'src/style/*.ts'])
		.pipe(gulpTs({...tsConfig.compilerOptions}))
		.js.pipe(babel(getGulpBabelConfig(isEsm)))
		.pipe(replace(/(import\s)['"]@study\/style\/src\/([^'"]+)['"]/g, `$1'@study/style/${targetDict}/$2'`))
		.pipe(dest(targetDict))
	}else {
		// require("@study/style/src/index.less")
		return src(['src/style/*.tsx', 'src/style/*.ts'])
		.pipe(gulpTs({...tsConfig.compilerOptions}))
		.js.pipe(babel(getGulpBabelConfig(isEsm)))
		.pipe(replace(/(require\(['"])@study\/style\/src\/([^'"]+)(['"]\))/g, `$1@study/style/${targetDict}/$2$3`))
		.pipe(dest(targetDict))
	}

}

async function compileToESM() {
	await compileStyle(true)
	await compileLess(true)
	await copyLess(true)
}

async function compileToCJS() {
	await compileStyle(false)
	await compileLess(false)
	await copyLess(false)
}



exports.default = parallel(buildPackage, compileToESM, compileToCJS)