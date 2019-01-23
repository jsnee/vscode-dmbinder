export function registerDMBinderRenderer(md: markdownit): markdownit {
    md.use(require('markdown-it-container'), 'dmbinder', {
        validate: validate,
        render: render
    });
    return md;
}

function validate(params: string): RegExpMatchArray | null {
    return params.trim().match(/^dmbinder\s+(.*)$/);
}

function render(tokens: any[], ndx: number): string {
    var m: RegExpMatchArray = tokens[ndx].info.trim().match(/^dmbinder\s+(.*)$/);
    if (tokens[ndx].nesting === 1) {
        let result = require('sync-exec')("pandoc " + m[1]);
        return result.stderr || result.stdout;
    }
    return '\n';
}

//function async execPandoc()

/*
    md.use(require('markdown-it-container'), 'spoiler', {

        validate: function(params) {
          return params.trim().match(/^spoiler\s+(.*)$/);
        },
      
        render: function (tokens, idx) {
          var m = tokens[idx].info.trim().match(/^spoiler\s+(.*)$/);
      
          if (tokens[idx].nesting === 1) {
            // opening tag
            return '<details><summary>' + md.utils.escapeHtml(m[1]) + '</summary>\n';
      
          } else {
            // closing tag
            return '</details>\n';
          }
        }
      });*/