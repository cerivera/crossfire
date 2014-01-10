import sh, glob, subprocess, urllib2, json, re
from path import path
from plistlib import readPlist, writePlist

def update_json_file(_file, dict):
    manifest = json.loads(open(_file, 'r').read())
    manifest.update(dict)

    f_w = open(_file, 'w')
    f_w.write(json.dumps(manifest))
    f_w.close()

def update_plist_file(_file, dict):
    pl = readPlist(_file)
    pl.update(dict)
    writePlist(pl, _file)


def cp(item, dest):
    for _file in glob.glob(item):
        if path(_file).isdir():
            sh.cp("-r", _file, dest)
        else:
            sh.cp(_file, dest)

def download_file(remote_src, local_dest):
        print "Downloading '%s' to '%s'" % (remote_src, local_dest)
        download = urllib2.urlopen(remote_src)
        local_file = open(local_dest, 'w')
        local_file.write(download.read())
        local_file.close()

def process_tpl(fin, fout, data):
    with open(fout, "w") as out:
        # TODO instead of looping through data,
        # loop through {{}} and use the data.
        for line in open(fin):
            for key in data:
                line = re.sub(r'{{\s*%s\s*}}' % key, data[key], line)
            out.write(line)
    out.close()

