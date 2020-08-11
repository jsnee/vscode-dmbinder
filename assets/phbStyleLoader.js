(function () {
    if (document.getElementsByClassName("phb").length && !document.getElementById("dmbinderHeadStyleBlock")) {
        document.head.innerHtml += "<style id='dmbinderHeadStyleBlock'>html, body { border: 0; font-size: 100%; font: inherit; vertical-align: baseline; margin: 0; padding: 0; line-height: 1; } * { -webkit-print-color-adjust: exact; }  @page { margin: 0; }</style>"
    }

    var aaa = document.getElementById("aaa");
    if (aaa) aaa.innerText = document.head.innerHTML;
})();