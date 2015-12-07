
build:
	@node_modules/.bin/browserify public/index.js -t babelify -r babel-polyfill -o public/bundle.js
	@node_modules/.bin/browserify public/worker.js -t babelify -r babel-polyfill -o public/worker.bundle.js

start: build
	@bin/start

clean:
	@rm -rf public/bundle.js

.PHONY: build start clean
