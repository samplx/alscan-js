alscan
======

An Access log scanner

The `0.5` version is a re-write.

The old callback
ridden JavaScript version has been redone using an async/await style.
The new version uses TypeScript. In fact, it is designed to be
executed directly by Node (v22.18 and later) directly, rather than
being compiled first.

Several of the old (problematic) libraries have been removed.
This makes the dependabot quiet.

The _hopelessly out-of-date_ user agent database has been removed. This makes some
existing options less than useful. Not much use in sorting results based
upon the user agent source, when they are all `Unknown`.

How the time of a reboot is determined has changed. The prior version scanned the **wtmp**
file. This is a binary format file that varied between linux and MacOS.
The libraries necessary to read and parse the file have security issues that
do not look to be resolved quickly. So, I modified the code to read from the
file `/proc/uptime`. This file can be parsed easily. However, it only exists on linux
systems. On other systems, the `reboot` time remains undefined.
This limits functionality, but removes the security issues.


## Summary

The **alscan** tool is used to extract data from web server access logs.
It creates a report based upon the contents of the logs and the options specified on the command-line.

More information about the tool is available at its [home page](http://samplx.org/alscan/).

The tool is released under the [Apache 2.0 License](http://http://apache.org/licenses/).

It is compatible with the Apache web server's
[combined](http://httpd.apache.org/docs/1.3/logs.html#combined "Apache documentation of the combined log format")
and the [common](http://en.wikipedia.org/wiki/Common_Log_Format "NCSA Common Log Format on Wikipedia")
log formats.

The software is designed for Linux and other Unix-like systems.


