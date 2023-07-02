(function() {
    'use strict';

    var css = '::-webkit-scrollbar { width: 6px; height: 6px; border-radius: 1.5px; } ::-webkit-scrollbar-track { background-color: #f5f5f500; } ::-webkit-scrollbar-thumb { background-color: #bbbbbb90; border-radius: 1.5px; }';

    var style = document.createElement('style');
    style.type = 'text/css';
    style.innerHTML = css;
    document.getElementsByTagName('head')[0].appendChild(style);
})();
