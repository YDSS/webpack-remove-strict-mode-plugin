class WebpackRemoveStrictModePlugin {
    /**
     * @constructor
     * @param {RegExp} exclude exclude files
     * @param {Array} extension file extension, '.js' by default
     */
    constructor({ exclude, extension }) {
        this.exclude = exclude;
        this.extension = [".js"];
        if (extension && Array.isArray(extension) && extension.length) {
            this.extension.concat(extension);
        }
        this.strictReg = /(\'|\")use\s+strict(\'|\")\;?/gm;
    }

    apply(compiler) {
        const emit = (compilation, cb) => {
            let errors = [];

            try {
                removeStrict(compilation);
            } catch (err) {
                errors.push(err);
            }

            if (errors.length) {
                compilation.errors = compilation.errors.concat(errors);
            }
            cb();
        };

        const removeStrict = compilation => {
            Object.keys(compilation.assets).map(filename => {
                if (
                    this.isMatchExtension(filename) &&
                    !this.isExclude(filename)
                ) {
                    let file = compilation.assets[filename];
                    let origin = file.source().toString();
                    let len = file.size();

                    let removed = origin.replace(this.strictReg, "");
                    // need replace when origin content changed
                    if (removed.length !== len) {
                        let buff = Buffer.from(removed);
                        compilation.assets[filename] = {
                            source: () => {
                                return buff;
                            },
                            size: () => {
                                return buff.length;
                            }
                        };
                    }
                }
            });
        };

        compiler.plugin("emit", emit);
    }

    isMatchExtension(filename) {
        return (
            this.extension.find(ext =>
                new RegExp(`\\${ext}$`).test(filename)
            ) != null
        );
    }

    isExclude(filename) {
        if (!this.exclude) {
            return false;
        }
        return this.exclude.test(filename);
    }
}

module.exports = WebpackRemoveStrictModePlugin;