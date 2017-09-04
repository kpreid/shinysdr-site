.PHONY: all clean push-out

all:
	# Note that files in the first source directory override those in the second.
	rsync --delete --progress -a \
		--exclude='.*' \
		--exclude='*~' \
		--exclude='/test' \
		--exclude='/client/require.js' \
		--exclude='/client/text.js' \
		--exclude='/client/measviz.*' \
		src/ app/shinysdr/i/webstatic/ out/
	cp app/shinysdr/deps/require.js app/shinysdr/deps/text.js app/shinysdr/deps/measviz/src/* out/client/
	cp app/shinysdr/i/webstatic/client/icon/icon-32.png out/favicon.ico.png

clean:
	if [[ -e out/ ]]; then rm -r out/*; fi

push-out: all
	# assumes that out/ is a git repository with the appropriate gh-pages as upstream
	cd out/ && git add -A && git commit -v && git push