Running the tests
-----------------

Lazy.js has a bunch of tests. They run in Node as well as the browser. To test
against Node:

```
npm test
```

To test against the browser, the easiest method is to just build the site and
open it up.

How to build the site
---------------------

The build process for the site is horrendously complicated right now. I'm going
to do something about that some day, but today is not that day. In the meantime,
here are at least some instructions for how to do it (this is mainly for myself,
so that I don't have to job my memory every time I do this).

First:

```
cd site
```

Install requirements (if necessary):

```
npm install -g deft
bundle install
```

Pull in front-end dependencies using deft:

```
deft
```

Now build the site using middleman:

```
middleman build
```

(At this point I hand-delete the bower package and npm package badges in the
resulting site/build/index.html file. Yes, seriously. Don't judge me.)

*Now*, head back to the lazy.js root directory, create symlinks, and generate
the API docs:

```
rake symlinks
rake generate_docs
```

Finally, to publish the new site, tar up everything in the build folder, run
`git checkout gh-pages`, extract the archive, and push the changes up.

It's *that* simple.
