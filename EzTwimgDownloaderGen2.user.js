// ==UserScript==
// @name        Ez Twimg Downloader Gen3
// @description ツイッターの画像を簡単に保存するUserScriptです。
// @author      00A0
// @match       https://twitter.com/*
// @match       https://pbs.twimg.com/media/*
// @version     3.0
// @grant       none
// @license     The Unlicense
// @updateURL   https://github.com/Yanorei32/EzTwimgDownloaderGen2/raw/master/EzTwimgDownloaderGen2.user.js
// ==/UserScript==

(function () {
  'use strict';

  // download filename format
  // https://twitter.com/{userName}/status/{tweetId}
  // https://pbs.twimg.com/media/{randomName}.{extension}
  const FILENAME_FORMAT = 'Twitter-{tweetId}-{userName}-{randomName}.{extension}';
  const IFRAME_NAME = 'EzTwimgDownloaderV3IFrame';

  if (window !== window.parent) {
    const splittedName = window.name.split(',');
    if (splittedName[0] != IFRAME_NAME) return;

    const linkElem = document.createElement('a');
    linkElem.href = window.location.href;
    linkElem.download = FILENAME_FORMAT
      .replace(/{userName}/g, splittedName[1])
      .replace(/{tweetId}/g, splittedName[2])
      .replace(/{randomName}/g, splittedName[3])
      .replace(/{extension}/g, splittedName[4]);

    document.documentElement.appendChild(linkElem);
    linkElem.click();
  } else {
    const processedLists = new WeakMap();

    const addCSS = () => {
      const btnCSS =
        '<style>' +
        '.download:hover>div>div>div{color: rgba(29, 161, 242, 1.0);}' +
        '.download:hover>div>div>div>div>div{background-color: rgba(29, 161, 242, 0.1);}' +
        '</style>'
        ;
      document.head.insertAdjacentHTML('beforeend', btnCSS);
    };

    const hiddenIframeWrapper = document.createElement('div');
    document.documentElement.appendChild(hiddenIframeWrapper);

    const toArray = (arrayLikeObject) => {
      return Array.prototype.slice.call(arrayLikeObject);
    };

    const getArticleByChildElement = (e) => {
      while (e.tagName != 'ARTICLE') {
        e = e.parentElement;
      }
      return e;
    };

    const parseNewFormatURI = (uri) => {
      const splittedURI = uri.split('/')[4].split('?');
      return {
        'randomName': splittedURI[0],
        'extension': splittedURI[1].split('&')[0].split('=')[1],
      };
    };

    const getTweetInfoByImage = (e) => {
      while (e.tagName != 'A') {
        e = e.parentElement;
      };

      const splittedHref = e.href.split('/');
      return {
        'displayName': splittedHref[3],
        'tweetId': splittedHref[5],
      };
    };

    const getImagesContainerByImageElement = (e) => {
      while (e.tagName != 'A') {
        e = e.parentElement;
      };
      return e.parentElement.parentElement.parentElement.parentElement;
    };

    const iframeClear = () => {
      hiddenIframeWrapper.textContent = null;
    };

    const iframeAdd = (url, displayName, tweetId, randomName, extension) => {
      const iframe = document.createElement('iframe');
      iframe.style.width = iframe.style.height = '0';
      iframe.style.visibility = 'hidden';
      iframe.src = url;
      iframe.name = [IFRAME_NAME, displayName, tweetId, randomName, extension].join(',');
      hiddenIframeWrapper.appendChild(iframe);
    };

    const addButtons = () => {
      const imgs = document.getElementsByTagName('img');
      if (imgs == undefined) return;

      for (let i = 0; i < imgs.length; i++) {
        const img = imgs[i];
        if (img.alt != '画像') continue;

        const article = getArticleByChildElement(img);
        if (processedLists.has(article)) continue;
        processedLists.set(article, 1);

        let buttonGr = article.querySelector('div[role="group"]:last-of-type, ul.tweet-actions, ul.tweet-detail-actions');
        let buttonPNode = Array.from(buttonGr.querySelectorAll(':scope>div>div, li.tweet-action-item>a, li.tweet-detail-action-item>a')).pop().parentNode;
        let button = buttonPNode.cloneNode(true);
        button.querySelector('svg').innerHTML =
          '<g class="svgDownload">' +
            '<path d="M3,14 v5 q0,2 2,2 h14 q2,0 2,-2 v-5 M7,10 l4,4 q1,1 2,0 l4,-4 M12,3 v11" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" />' +
          '</g>'
        ;
        button.classList.add('download');
        buttonGr.insertBefore(button, buttonPNode.nextSibling);

        button.addEventListener('click', () => {
          const tweetImgs = getImagesContainerByImageElement(img).getElementsByTagName('img');
          const tweetInfo = getTweetInfoByImage(img);
          iframeClear();

          for (let j = 0; j < tweetImgs.length; j++) {
            const parsedURI = parseNewFormatURI(tweetImgs[j].src);
            const maximumQualityURI = `https://pbs.twimg.com/media/${parsedURI.randomName}.${parsedURI.extension}:orig`;

            if (!(event || window.event).shiftKey) {
              iframeAdd(
                maximumQualityURI,
                tweetInfo.displayName,
                tweetInfo.tweetId,
                parsedURI.randomName,
                parsedURI.extension
              );
            } else {
              window.open(maximumQualityURI);
            };
          }
        });
      }
    };

    //const destroyPromotion = (e) => {
    //  const spantags = e.getElementsByTagName('span');
    //  //getArticleByChildElement(spantags[spantags.length-1]).parentElement.parentElement.parentElement.parentElement.textContent = null;
    //};

    new MutationObserver((records) => {
      records.forEach((record) => {
        toArray(record.addedNodes).forEach((addedNode) => {
          if (addedNode.nodeType != Node.ELEMENT_NODE) return;

          addButtons();
          //destroyPromotion(addedNode);
        });
      });
    }).observe(
      document.body,
      {
        childList: true,
        subtree: true,
      }
    );
    addCSS();
  }
})();
