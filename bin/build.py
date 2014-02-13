import sh
import util
from settings import settings
from cement.core import foundation, controller
from path import path
from jinja2 import Environment, FileSystemLoader
import os
from subprocess import call


class BuildBaseController(controller.CementBaseController):
    class Meta:
        label = 'base'
        description = 'description'

        arguments = [
        ]

    @controller.expose(hide=True, aliases=['run'])
    def default(self):
        self.build()

    @controller.expose(help="Builds extensions")
    def build(self):
        self._init_paths()

        settings['firefox_id'] = self._get_jid()

        sh.rm("-rf", self.paths['builds'])
        sh.rm("-rf", self.paths['sandbox'])

        sh.mkdir(self.paths['builds'])
        self._build_sandbox() 
        self._build_chrome()
        self._build_safari()
        self._build_firefox()

        self._package_firefox()

        sh.rm("-r", self.paths['sandbox'])

    def _init_paths(self):
        self.log.info("Setting up paths")

        self.paths = {
            'bin': path(__file__).dirname().abspath()
        }

        self.paths['root'] = self.paths['bin'].parent
        self.paths['sandbox'] = path(self.paths['root'] + '/sandbox')
        self.paths['src'] = path(self.paths['root'] + '/src')
        self.paths['builds'] = path(self.paths['root'] + '/builds')
        self.paths['packages'] = path(self.paths['root'] + '/packages')

    def _build_sandbox(self):
        self.log.info("Building sandbox.");

        # Create sandbox of our codebase
        util.cp(self.paths['src'], self.paths['sandbox'])
        util.cp(self._s('js/common/*'), self._s('js/background'))
        util.cp(self._s('js/common/*'), self._s('js/content-scripts'))

        # browserify the content-scripts
        os.system("browserify %s > %s/bundle.js" % (
            self._s('js/content-scripts/main.js'),
            self._s('js/content-scripts')
        ))

        # browsreify the background
        os.system("browserify --noparse='%s' --noparse='%s' %s > %s/bundle.js" % (
            self._s('js/background/storage/simple.js'),
            self._s('js/background/api/firefox.js'),
            self._s('js/background/main.js'),
            self._s('js/background')
        ))

        self._process_jinja2_files({
            "settings": settings,
            "args": {}
        })

    def _build_chrome(self):
        self.log.info("Building chrome.")

        sh.mkdir("-p", self._b('chrome/js/background'))
        sh.mkdir("-p", self._b('chrome/js/content-scripts'))

        util.cp(self._s('css'), self._b('chrome'))
        util.cp(self._s('images'), self._b('chrome'))
        util.cp(self._s('templates/common'), self._b('chrome/templates'))
        util.cp(self._s('metadata/chrome/*'), self._b('chrome'))
        util.cp(self._s('js/background/bundle.js'), self._b('chrome/js/background'))
        util.cp(self._s('js/content-scripts/bundle.js'), self._b('chrome/js/content-scripts'))

    def _build_safari(self):
        self.log.info("Building safari.")

        sh.mkdir("-p", self._b('safari/js'))

        util.cp(self._s('css'), self._b('safari'))
        util.cp(self._s('images'), self._b('safari'))
        util.cp(self._s('templates/common'), self._b('safari/templates'))
        util.cp(self._s('templates/safari/*'), self._b('safari/templates'))
        util.cp(self._s('metadata/safari/*'), self._b('safari'))
        util.cp(self._s('images/safari-icon.png'), self._b('safari/icon.png'))
        util.cp(self._s('js/background/bundle.js'), self._b('safari/js/background'))
        util.cp(self._s('js/content-scripts/bundle.js'), self._b('safari/js/content-scripts'))

    def _build_firefox(self):
        self.log.info("Building firefox.")

        sh.mkdir("-p", self._b('firefox/data/js'))
        sh.mkdir("-p", self._b('firefox/lib'))

        # Content Scripts
        util.cp(self._s('css'), self._b('firefox/data'))
        util.cp(self._s('images'), self._b('firefox/data'))
        util.cp(self._s('templates/common'), self._b('firefox/data/templates'))
        util.cp(self._s('js/content-scripts/bundle.js'), self._b('firefox/data/js'))

        # Background
        util.cp(self._s('js/background/*'), self._b('firefox/lib'))

        # Metadata
        util.cp(self._s('metadata/firefox/*'), self._b('firefox'))


    def _package_firefox(self):
        self.log.info("Package firefox.")
        sh.mkdir("-p", self._p('firefox'))
        call("cd %s;. bin/activate > /dev/null && cd %s; cfx xpi; mv %s.xpi %s/%s.%s.xpi" % (
            self._bi('/firefox/addon-sdk-1.15'), 
            self._b('firefox'), 
            settings['codename'],
            self._p('firefox'), 
            settings['codename'],
            settings['version']
        ), shell=True)

    def _get_jid(self):
        try:
            f = open(self._bi('jid'))
            jid = f.read().strip()
        except:
            # Use the addon-sdk to generate a jID for the firefox project
            import sys
            sys.path.append(self._bi('firefox/addon-sdk-1.15/python-lib/cuddlefish'))
            from preflight import create_jid
            jid = create_jid()

            f = open(self._bi('jid'), 'w') 
            f.write(jid)
            f.close()

        return jid

    def _minify(self):
        self.log.info("Minifying.")

    # get absolute path in sandbox/
    def _s(self, _path):
        return path(self.paths['sandbox'] + '/' + _path)

    # get absolute path in builds/
    def _b(self, _path):
        return path(self.paths['builds'] + '/' + _path)

    # get absolute path in packages/
    def _p(self, _path):
        return path(self.paths['packages'] + '/' + _path)

    # get absolute path in bin/
    def _bi(self, _path):
        return path(self.paths['bin'] + '/' + _path)

    def _process_jinja2_files(self, data):
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

