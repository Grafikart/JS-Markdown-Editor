.PHONY=page

dev:
	node fuse

page:
	node fuse dist
	sed -i -- 's/\/app\./\/JS-Markdown-Editor\/app\./g' dist/index.html
	cd dist && git add .
	cd dist && git commit --amend -m "Page"
	cd dist &&git push origin gh-pages --force
