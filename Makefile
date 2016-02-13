.PHONY: all clean

all:
	# Note that files in the first source directory override those in the second.
	rsync --delete --progress -a \
		--exclude='.*' \
		--exclude='*~' \
		src/ app/shinysdr/webstatic/ out/

clean:
	if [[ -e out/ ]]; then rm -r out/; fi
