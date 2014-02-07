import sh
import util
from settings import settings
from cement.core import foundation, controller
from path import path
from jinja2 import Environment, FileSystemLoader
import os


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

        sh.rm("-rf", self.paths['builds'])
        sh.rm("-rf", self.paths['sandbox'])

        sh.mkdir(self.paths['builds'])
        self.build_sandbox() 
        self.build_chrome()
        self.build_safari()
        self.build_firefox()

        sh.rm("-r", self.paths['sandbox'])

    def init_paths(self):
        self.log.info("Setting up paths")

        self.paths = {
            'bin': path(__file__).dirname().abspath()
        }

        self.paths['root'] = self.paths['bin'].parent
        self.paths['sandbox'] = path(self.paths['root'] + '/sandbox')
        self.paths['code'] = path(self.paths['root'] + '/code')
        self.paths['builds'] = path(self.paths['root'] + '/builds')
        self.paths['packages'] = path(self.paths['root'] + '/packages')

    def build_sandbox(self):
        self.log.info("Building sandbox.");

        # Create sandbox of our codebase
        util.cp(self.paths['code'], self.paths['sandbox'])
        util.cp(self.s('js/common/*'), self.s('js/background'))
        util.cp(self.s('js/common/*'), self.s('js/content-scripts'))

        # browserify the content-scripts
        os.system("browserify %s > %s/bundle.js" % (
            self.s('js/content-scripts/main.js'),
            self.s('js/content-scripts')
        ))

        # browsreify the background
        os.system("browserify --noparse='%s' %s > %s/bundle.js" % (
            self.s('js/background/api/firefox.js'),
            self.s('js/background/main.js'),
            self.s('js/background')
        ))

        self.process_jinja2_files({
            "settings": settings,
            "args": {
                "debug_mode" : "true" if self.pargs.debug_mode else "false"
            }
        })

    def build_chrome(self):
        self.log.info("Building chrome.")

        sh.mkdir("-p", self.b('chrome/js/background'))
        sh.mkdir("-p", self.b('chrome/js/content-scripts'))

        util.cp(self.s('css'), self.b('chrome'))
        util.cp(self.s('images'), self.b('chrome'))
        util.cp(self.s('templates/common'), self.b('chrome/templates'))
        util.cp(self.s('metadata/chrome/*'), self.b('chrome'))
        util.cp(self.s('js/background/bundle.js'), self.b('chrome/js/background'))
        util.cp(self.s('js/content-scripts/bundle.js'), self.b('chrome/js/content-scripts'))

    def build_safari(self):
        self.log.info("Building safari.")

        sh.mkdir("-p", self.b('safari/js'))

        util.cp(self.s('css'), self.b('safari'))
        util.cp(self.s('images'), self.b('safari'))
        util.cp(self.s('templates/common'), self.b('safari/templates'))
        util.cp(self.s('templates/safari/*'), self.b('safari/templates'))
        util.cp(self.s('metadata/safari/*'), self.b('safari'))
        util.cp(self.s('images/safari-icon.png'), self.b('safari/icon.png'))
        util.cp(self.s('js/background/bundle.js'), self.b('safari/js/background'))
        util.cp(self.s('js/content-scripts/bundle.js'), self.b('safari/js/content-scripts'))

    def build_firefox(self):
        self.log.info("Building firefox.")

        sh.mkdir("-p", self.b('firefox/data/js'))
        sh.mkdir("-p", self.b('firefox/lib'))

        # Content Scripts
        util.cp(self.s('css'), self.b('firefox/data'))
        util.cp(self.s('images'), self.b('firefox/data'))
        util.cp(self.s('templates/common'), self.b('firefox/data/templates'))
        util.cp(self.s('js/content-scripts/bundle.js'), self.b('firefox/data/js'))

        # Background
        util.cp(self.s('js/background/*'), self.b('firefox/lib'))

        # Metadata
        util.cp(self.s('metadata/firefox/*'), self.b('firefox'))


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

    def process_jinja2_files(self, data):
        self.log.info("Processing Jinja2 files.")
        for jf in sh.find(self.paths['sandbox'], "-name", "*.j2"):
            jf = jf.strip()
            self.log.info("Processing '%s'" % jf)
            jf_components = jf.split("/")
            env = Environment(loader=FileSystemLoader("/".join(jf_components[:-1])), trim_blocks=True)
            new_file = open(jf.replace(".j2", ""), "w")
            new_file.write(env.get_template(jf_components[-1]).render(data))
            new_file.close()
            sh.rm(jf)


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

