import React from 'react'; // tslint:disable-line no-unused-variable
import katex from 'katex';
import 'katex/dist/katex.min.css';

import { Tokenizer, Token, RegexTokenizerSplitter, EmitFn } from '../../assets/js/utils/token_unfolder';
import { registerPlugin } from '../../assets/js/plugins';

// ignore the group, allow whitespace, beginning of line, or open paren
const latexPreRegex = '(?:\\s|^|\\()';
// ignore the group, allow whitespace, end of line, punctuation, or close paren
const latexPostRegex = '(?:\\s|$|\\.|,|!|\\?|\\))';

registerPlugin<void>(
  {
    name: 'LaTeX',
    author: 'Jeff Wu',
    description: `
      Lets you inline LaTeX between $ delimiters,
      or add block LaTeX between $$ delimiters.
      Limited to what KaTeX supports.
    `,
  },
  function(api) {
    api.registerHook('session', 'renderLineTokenHook', (tokenizer) => {
      return tokenizer.then(RegexTokenizerSplitter<React.ReactNode>(
        new RegExp(latexPreRegex + '(\\$\\$(\\n|.)+?\\$\\$)' + latexPostRegex),
        (token: Token, emit: EmitFn<React.ReactNode>, wrapped: Tokenizer<React.ReactNode>) => {
          for (let i = 0; i < token.info.length; i++) {
            if (token.info[i].cursor) {
              return emit(...wrapped.unfold(token));
            }
            if (token.info[i].highlight) {
              return emit(...wrapped.unfold(token));
            }
          }
          try {
            const html = katex.renderToString(token.text.slice(2, -2), { displayMode: true });
            emit(<div key={`latex-${token.index}`} dangerouslySetInnerHTML={{__html: html}}/>);
          } catch (e) {
            api.session.showMessage(e.message, { text_class: 'error' });
            emit(...wrapped.unfold(token));
          }
        }
      )).then(RegexTokenizerSplitter<React.ReactNode>(
        new RegExp(latexPreRegex + '(\\$(\\n|.)+?\\$)' + latexPostRegex),
        (token: Token, emit: EmitFn<React.ReactNode>, wrapped: Tokenizer<React.ReactNode>) => {
          for (let i = 0; i < token.info.length; i++) {
            if (token.info[i].cursor) {
              return emit(...wrapped.unfold(token));
            }
            if (token.info[i].highlight) {
              return emit(...wrapped.unfold(token));
            }
          }
          try {
            const html = katex.renderToString(token.text.slice(1, -1), { displayMode: false });
            emit(<span key={`latex-${token.index}`} dangerouslySetInnerHTML={{__html: html}}/>);
          } catch (e) {
            api.session.showMessage(e.message, { text_class: 'error' });
            emit(...wrapped.unfold(token));
          }
        }
      ));
    });
  },
  (api => api.deregisterAll()),
);
