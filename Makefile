.PHONY: all clean

all:
	# Note that files in the first source directory override those in the second.
	rsync --delete --progress -a \
		--exclude='.*' \
		--exclude='*~' \
		--exclude='/test' \
		--exclude='/client/require.js' \
		--exclude='/client/text.js' \
		src/ app/shinysdr/i/webstatic/ out/
	cp app/shinysdr/deps/require.js app/shinysdr/deps/text.js out/client/

clean:
	if [[ -e out/ ]]; then rm -r out/; fi
