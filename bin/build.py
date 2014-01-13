import sh, util, settings
from cement.core import foundation, controller
from path import path
from subprocess import call

class BuildBaseController(controller.CementBaseController):
    class Meta:
        label = 'base'
        description = 'Base Description'

        arguments = [
            (['-dm', '--debug-mode'], dict(action='store_true', help='Enable log statements in browser console.'))
        ]

    @controller.expose(hide=True, aliases=['run'])
    def default(self):
        self.build()

    @controller.expose(help="Builds extensions")
    def build(self):
        self.init_paths()

        # Cleanup
        sh.rm("-rf", self.paths['builds'])
        sh.rm("-rf", self.paths['sandbox'])
        sh.mkdir(self.paths['builds'])

        # Create sandbox
        util.cp(self.paths['code'], self.paths['sandbox'])

        # Build constants file
        self.log.info("Compiling constants JS")
        tpl_data = {
            "DEBUG_MODE" : "true" if self.pargs.debug_mode else "false",
            "VERSION" : settings.VERSION
        }
        util.process_tpl(
            "%s/constants.js.tpl" % self.s('js/common'),
            "%s/constants.js" % self.s('js/common'),
            tpl_data)

        # Build extension folders
        self.build_chrome()
        self.build_safari()
        self.build_firefox()

        sh.rm("-r", self.paths['sandbox'])

    def init_paths(self):
        self.log.info("Setting up paths")

        self.paths = {}
        self.paths['bin'] = path(__file__).dirname().abspath()
        self.paths['root'] = self.paths['bin'].parent
        self.paths['sandbox'] = path(self.paths['root'] + '/sandbox')
        self.paths['code'] = path(self.paths['root'] + '/code')
        self.paths['builds'] = path(self.paths['root'] + '/builds')
        self.paths['packages'] = path(self.paths['root'] + '/packages')

    def build_chrome(self):
        self.log.info("Building chrome.")

        sh.mkdir(self.b('chrome'))

        util.cp(self.s('css'), self.b('chrome'))
        util.cp(self.s('images'), self.b('chrome'))
        util.cp(self.s('templates/common'), self.b('chrome/templates'))
        util.cp(self.s('metadata/chrome/*'), self.b('chrome'))

        sh.mkdir(self.b('chrome/js'))
        util.cp(self.s('js/background'), self.b('chrome/js'))
        util.cp(self.s('js/common/*'), self.b('chrome/js/background'))
        util.cp(self.s('js/content-scripts'), self.b('chrome/js'))
        util.cp(self.s('js/common/*'), self.b('chrome/js/content-scripts'))

        util.update_json_file(self.b('chrome/manifest.json'), {
            "version": settings.VERSION,
            "name": settings.LABEL,
            #"browser_action" : {
            #    "default_title": settings.LABEL
            #},
            "description": settings.DESCRIPTION,
            "homepage_url": settings.WEBSITE
        })

    def build_safari(self):
        self.log.info("Building safari.")

        sh.mkdir(self.b('safari'))
        util.cp(self.s('css'), self.b('safari'))
        util.cp(self.s('images'), self.b('safari'))
        util.cp(self.s('templates/common'), self.b('safari/templates'))
        util.cp(self.s('templates/safari/*'), self.b('safari/templates'))
        util.cp(self.s('metadata/safari/*'), self.b('safari'))
        util.cp(self.s('images/safari-icon.png'), self.b('safari/icon.png'))

        sh.mkdir(self.b('safari/js'))
        util.cp(self.s('js/background'), self.b('safari/js'))
        util.cp(self.s('js/common/*'), self.b('safari/js/background'))
        util.cp(self.s('js/content-scripts'), self.b('safari/js'))
        util.cp(self.s('js/common/*'), self.b('safari/js/content-scripts'))

        util.update_plist_file(self.b('safari/Info.plist'), {
            "CFBundleShortVersionString": settings.VERSION,
            "CFBundleVersion": settings.VERSION,
            "CFBundleDisplayName": settings.LABEL,
            "CFBundleIdentifier": settings.BUNDLE_ID,
            "Website": settings.WEBSITE,
            "Description": settings.DESCRIPTION
        })


    def build_firefox(self):
        self.log.info("Building firefox.")
        sh.mkdir(self.b('firefox'))

        # Content Scripts
        sh.mkdir(self.b('firefox/data'))
        util.cp(self.s('css'), self.b('firefox/data'))
        util.cp(self.s('images'), self.b('firefox/data'))
        util.cp(self.s('templates/common'), self.b('firefox/data/templates'))

        sh.mkdir(self.b('firefox/data/js'))
        util.cp(self.s('js/common/*'), self.b('firefox/data/js'))
        util.cp(self.s('js/content-scripts/*'), self.b('firefox/data/js'))

        # Background
        sh.mkdir(self.b('firefox/lib'))
        util.cp(self.s('js/common/*'), self.b('firefox/lib'))
        util.cp(self.s('js/background/*'), self.b('firefox/lib'))

        # Metadata
        util.cp(self.s('metadata/firefox/*'), self.b('firefox'))

        util.update_json_file(self.b('firefox/package.json'), {
            "name": settings.CODE_NAME,
            "version": settings.VERSION,
            "author": settings.AUTHOR,
            "fullName": settings.LABEL,
            "homepage": settings.WEBSITE,
            "description": settings.DESCRIPTION
        })


    def minify(self):
        self.log.info("Minifying.")

    # get absolute path in sandbox/
    def s(self, _path):
        return path(self.paths['sandbox'] + '/' + _path)

    # get absolute path in builds/
    def b(self, _path):
        return path(self.paths['builds'] + '/' + _path)

    # get absolute path in packages/
    def p(self, _path):
        return path(self.paths['packages'] + '/' + _path)


class Build(foundation.CementApp):
    class Meta:
        label = 'Build'
        base_controller = BuildBaseController

app = Build()

try:
    app.setup()
    app.run()
finally:
    app.close()

