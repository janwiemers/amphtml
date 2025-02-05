/**
 * Copyright 2019 The AMP HTML Authors. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS-IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {BrowserController, RequestBank} from '../../testing/test-helper';
import {parseQueryString} from '../../src/url';

const config = describe
  .configure()
  .skipEdge()
  .ifChrome()
  .skipSinglePass();

config.run('amp-story analytics', () => {
  const extensions = ['amp-story:1.0', 'amp-analytics', 'amp-social-share'];
  const body = `
        <amp-story standalone>
          <amp-analytics>
            <script type="application/json">
            {
              "requests": {
                "endpoint": "${RequestBank.getUrl()}"
              },
              "triggers": {
                "trackPageview": {
                  "on": "story-page-visible",
                  "request": "endpoint",
                  "extraUrlParams": {
                    "pageVisible": "\${storyPageId}"
                  }
                },
                "trackBookendEnter": {
                  "on": "story-bookend-enter",
                  "request": "endpoint",
                  "extraUrlParams": {
                    "bookendEnter": true
                  }
                },
                "trackBookendExit": {
                  "on": "story-bookend-exit",
                  "request": "endpoint",
                  "extraUrlParams": {
                    "bookendExit": true
                  }
                }
              },
              "extraUrlParams": {
                "pageVisible": "\${storyPageId}",
                "bookendEnter": false,
                "bookendExit": false,
                "muted": false,
                "unmuted": false
              }
            }
            </script>
          </amp-analytics>
          <amp-story-page id="page-1">
            <amp-story-grid-layer template="vertical">
              <h1>First page</h1>
            </amp-story-grid-layer>
          </amp-story-page>
          <amp-story-page id="page-2">
            <amp-story-grid-layer template="vertical">
              <h1>Second page</h1>
            </amp-story-grid-layer>
          </amp-story-page>
          <amp-story-bookend layout="nodisplay">
            <script type="application/json">
            {
              "bookendVersion": "v1.0",
              "shareProviders": [
                {
                  "provider": "facebook",
                  "data-param-app_id": "1682114265451337",
                  "data-param-href": "https://fr-fr.facebook.com/LaRochePosayFrance/"
                },
                {
                  "provider": "twitter",
                  "data-param-url": "https://twitter.com/larocheposayfr?lang=fr"
                }
              ],
              "components": [
                {
                  "type": "heading",
                  "text": "Learn more about our 0% formulation charter"
                },
                {
                  "type": "cta-link",
                  "links": [
                    {
                      "text": "Click here",
                      "url": "https://www.laroche-posay.fr/produits-soins/anthelios/peaux-sensibles-ou-allergiques-au-soleil-r93.aspx"
                    }
                  ]
                },
                {
                  "type": "landscape",
                  "title": "TRAPPIST-1 Planets May Still Be Wet Enough for Life",
                  "url": "http://example.com/article.html",
                  "category": "astronomy",
                  "image": "http://placehold.it/360x760"
                }
              ]
            }
            </script>
          </amp-story-bookend>
        </amp-story>`;
  describes.integration('amp-story analytics', {body, extensions}, env => {
    let browser;
    beforeEach(() => {
      browser = new BrowserController(env.win);
      env.iframe.style.height = '732px';
      env.iframe.style.width = '412px';
      return browser.waitForElementLayout('amp-story', 20000);
    });

    it('should send analytics event when landing on a page', async () => {
      await browser.waitForElementLayout('#page-1', 20000);

      const req = await RequestBank.withdraw();
      const q = parseQueryString(req.url.substr(1));
      expect(q['pageVisible']).to.equal('page-1');
    });

    it('should send analytics event when navigating', async () => {
      browser.click('#page-1');
      await browser.waitForElementLayout('#page-2', 20000);

      const req = await RequestBank.withdraw();
      const q = parseQueryString(req.url.substr(1));
      expect(q['pageVisible']).to.equal('page-2');
    });

    it('should send analytics event when entering bookend', async () => {
      browser.click('#page-1');
      await browser.waitForElementLayout('#page-2', 20000);
      browser.click('#page-2');
      await browser.wait(100);

      const req = await RequestBank.withdraw();
      const q = parseQueryString(req.url.substr(1));
      expect(q['bookendEnter']).to.equal('true');
    });

    it('should send analytics event when exiting bookend', async () => {
      browser.click('#page-1');
      await browser.waitForElementLayout('#page-2', 20000);
      browser.click('#page-2');
      await browser.wait(100);
      browser.click('amp-story-bookend');
      await browser.wait(100);

      const req = await RequestBank.withdraw();
      const q = parseQueryString(req.url.substr(1));
      expect(q['bookendExit']).to.equal('true');
    });
  });
});
