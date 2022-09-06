// ==UserScript==
// @name        Ez Twimg Downloader Gen2
// @description ツイッターの画像を簡単に保存するUserScriptです。
// @author      yanorei32
// @namespace   http://tyan0.dip.jp/~rei/
// @include     https://twitter.com/*
// @include     https://pbs.twimg.com/media/*
// @version     2.0
// @grant       none
// @license     The Unlicense
// @updateURL   https://github.com/Yanorei32/EzTwimgDownloaderGen2/raw/master/EzTwimgDownloaderGen2.user.js
// ==/UserScript==

(function() {
  'use strict';

  // download filename format
  // https://twitter.com/{userName}/status/{tweetId}
  // https://pbs.twimg.com/media/{randomName}.{extension}
  const FILENAME_FORMAT = 'Twitter-{tweetId}-{userName}-{randomName}.{extension}';
  const IFRAME_NAME = 'EzTwimgDownloaderV2IFrame';

  if (window !== window.parent) {
    const splittedName = window.name.split(',');

    if(splittedName[0] != IFRAME_NAME)
      return;

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

    const hiddenIframeWrapper = document.createElement('div');
    document.documentElement.appendChild(hiddenIframeWrapper);

    const toArray = (arrayLikeObject) => {
      return Array.prototype.slice.call(arrayLikeObject);
    };

    const getArticleByChildElement = (e) => {
      while (e.tagName != 'ARTICLE')
        e = e.parentElement;

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
      while (e.tagName != 'A')
        e = e.parentElement;

      const splittedHref = e.href.split('/');

      return {
        'displayName': splittedHref[3],
        'tweetId': splittedHref[5],
      };
    };

    const getImagesContainerByImageElement = (e) => {
      while (e.tagName != 'A')
        e = e.parentElement;

      return e.parentElement.parentElement;
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

    const addButtons = (e) => {
      const imgs = document.getElementsByTagName('img');

      if(imgs == undefined) return;

      for(let i = 0;i < imgs.length;i++){
        const img = imgs[i];

        if(img.alt != '画像') continue;

        const article = getArticleByChildElement(img);

        if(processedLists.has(article)) continue;

        processedLists.set(article, 1);

        const button = document.createElement('div');
        button.setAttribute('class', 'css-18t94o4 css-1dbjc4n r-1niwhzg r-42olwf r-sdzlij r-1phboty r-rs99b7 r-14u3nlf r-mvpalk r-1x5g5r8 r-15ysp7h r-4wgw6l r-1ny4l3l r-o7ynqc r-6416eg r-lrvibr');
        button.setAttribute('role', 'button');

        button.innerHTML =
            '<div dir="auto" class="css-901oao r-1awozwy r-1cvl2hr r-6koalj r-18u37iz r-16y2uox r-1tl8opc r-1b43r93 r-b88u0q r-1777fci r-14yzgew r-bcqeeo r-q4m81j r-qvutc0" style="">' +
                '<svg viewBox="0 0 24 24" aria-hidden="true" class="r-1cvl2hr r-4qtqp9 r-yyyyoo r-1hjwoze r-dnmrzs r-bnwqim r-1plcrui r-lrvibr r-12ym1je" style="">' +
                    '<g>'+
                        '<path d="M19.75 2H4.25C3.01 2 2 3.01 2 4.25v15.5C2 20.99 3.01 22 4.25 22h15.5c1.24 0 2.25-1.01 2.25-2.25V4.25C22 3.01 20.99 2 19.75 2zM4.25 3.5h15.5c.413 0 .75.337.75.75v9.676l-3.858-3.858c-.14-.14-.33-.22-.53-.22h-.003c-.2 0-.393.08-.532.224l-4.317 4.384-1.813-1.806c-.14-.14-.33-.22-.53-.22-.193-.03-.395.08-.535.227L3.5 17.642V4.25c0-.413.337-.75.75-.75zm-.744 16.28l5.418-5.534 6.282 6.254H4.25c-.402 0-.727-.322-.744-.72zm16.244.72h-2.42l-5.007-4.987 3.792-3.85 4.385 4.384v3.703c0 .413-.337.75-.75.75z"></path>' +
                        '<circle cx="8.868" cy="8.309" r="1.542"></circle>' +
                    '</g>' +
                '</svg>' +
                '<span class="css-901oao css-16my406 css-bfa6kz r-1tl8opc r-1b43r93 r-14yzgew r-bcqeeo r-qvutc0"></span>' +
            '</div>'
        ;
        //button.innerHTML = 'Download';
        //button.style = 'height: 20px; margin-top:10px;';

        button.addEventListener('click', (e) => {
          const tweetImgs = getImagesContainerByImageElement(img).getElementsByTagName('img');
          const tweetInfo = getTweetInfoByImage(img);
          iframeClear();

          for(let j = 0; j < tweetImgs.length; j++) {
            const parsedURI = parseNewFormatURI(tweetImgs[j].src);
            const maximumQualityURI = `https://pbs.twimg.com/media/${parsedURI['randomName']}.${parsedURI['extension']}:orig`;

            if(!(event || window.event).shiftKey){
              iframeAdd(
                maximumQualityURI,
                tweetInfo['displayName'],
                tweetInfo['tweetId'],
                parsedURI['randomName'],
                parsedURI['extension']
              );
            } else {
              window.open(maximumQualityURI);
            }
          }
        });

        const svg = article.getElementsByTagName("svg").length-1;
        article.getElementsByTagName("svg")[svg].parentNode.parentNode.parentNode.parentNode.parentNode.parentNode.appendChild(button);
      }
    };

    const destroyPromotion = (e) => {
      const spantags = e.getElementsByTagName('span');
      if(spantags && spantags[spantags.length-1].innerHTML == 'プロモーション')
        getArticleByChildElement(spantags[spantags.length-1]).parentElement.parentElement.parentElement.parentElement.textContent = null;
    };

    new MutationObserver((records) => {
      records.forEach((record) => {
        toArray(record.addedNodes).forEach((addedNode) => {
          if(addedNode.nodeType != Node.ELEMENT_NODE) return;

          addButtons(addedNode);
          destroyPromotion(addedNode);
        });
      });
    }).observe(
      document.body,
      {
        childList: true,
        subtree: true,
      }
    );

    addButtons(document);
  }
})();
