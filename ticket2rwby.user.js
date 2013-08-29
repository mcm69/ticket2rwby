// ==UserScript==
// @name       Ticket to ride (Belarusian Railway)
// @namespace  http://mcm69.org
// @version    1.0
// @description  A user script to help catch that last train ticket on http://poezd.rw.by
// @match      https://poezd.rw.by/wps/myportal/home/rp/buyTicket/!ut*
// @copyright  2013+, Yuriy Opryshko
// ==/UserScript==
var ticket2rw = {
    defaultConfig: {
        enabled: false,
        trainNumber: '42',
        trackedCategories: [true, true, true, true, true, true],
        //todo: add ui for these options
        minTickets: 1,
        refreshInterval: 30,
        playAlertSound: true    
    },

    localization: {
        enabled: 'Включено:',
        ticketCategories: ["Общие", "Сидячие", "Плацкартные", "Купейные", "СВ", "Мягкие"],
        foundTickets: 'Найдены билеты на поезд ',
        trainNumber: 'Номер поезда:',
        categoryHeader: 'Тип билетов:',
        ok: 'OK',
        close: 'Закрыть',
        reloadText: 'Ticket2rw: Обновляем данные...'
    },
    
    timeoutVar: null,
    
    tickets: [],

    elements: {},

    findTrainSpan: function(){ 
        var config = this.config,
            spans = document.getElementsByTagName('span'),i;
        for(i=0;i<spans.length;i++){
            if(spans[i].innerText.substring(0,config.trainNumber.length) === config.trainNumber) {
                return spans[i];
            }
        }
    },

    getTickets: function(){
        var me=this,
            span = me.findTrainSpan(), i,j;

        if (!span) {
            console.log('no such train or no tickets for train #'+me.config.trainNumber);
            me.tickets = [0,0,0,0,0,0];
            return false;
        }

        var tr = span.parentNode.parentNode.parentNode.parentNode;
        var tds = tr.getElementsByTagName('td');
            

        for(j=0, i=tds.length-6;i<tds.length;i++,j++){
            var td = tds[i];
            var cat = me.localization.ticketCategories[j];
            var numberSpan = td.getElementsByTagName('span')[0];
            if(numberSpan){
                var number = Number(numberSpan.innerText);
                me.tickets[j] = number;
                console.warn(cat + ': '+number);
                
            }
            else{
                me.tickets[j] = 0;
                console.log(cat + ': 0');
            }
        }

        return true;
    },

    checkTickets: function(){
        var me=this,
            ticketsFound = false, 
            ticketsMessage = me.localization.foundTickets + me.config.trainNumber;
        
        for (var i = 0; i < me.tickets.length; i++) {
            if (me.config.trackedCategories[i] && me.tickets[i] >= me.config.minTickets) {
                    ticketsFound = true;
                    ticketsMessage += '\n'+me.localization.ticketCategories[i]+': '+me.tickets[i];
                }
        }
        if (ticketsFound) {
            if(me.config.playAlertSound){
                var player = me.playAlertSound();
                player.addEventListener('ended', function() {alert(ticketsMessage)});
            } else {
                alert(ticketsMessage);
            }
        }

        return ticketsFound;
    },

    playAlertSound: function() {
        console.log('playing alert sound');
        var player = document.createElement('audio');
        player.id = 'soundPlayer';
        player.src = 'https://raw.github.com/mcm69/ticket2rwby/master/ding.ogg';
        player.style.display = 'none';
        document.body.appendChild(player);
        player.play();
        return player;
    },

    loadConfig: function(){
        if (localStorage.ticket2rw_config) {
            this.config = JSON.parse(localStorage.ticket2rw_config);
        }
        else {
            this.config = this.defaultConfig;
        }
        return this.config;

    },

    saveConfig: function(){
        localStorage.ticket2rw_config = JSON.stringify(this.config);
    },

    reloadPage: function(){
        var reloadBtn = document.getElementsByClassName('commandExButton')[1];
        if (reloadBtn) {
            document.getElementById('wrapperLoading').getElementsByTagName('span')[0].innerHTML = ticket2rw.localization.reloadText;
            reloadBtn.click();
        } else {
            console.warn('Reload button not found!');
            location.reload();
        }
    },


    injectHtml: function(){
        var me=this,
            windowHtml = '<h2>ticket2rw</h2><table><tr><td><strong id="ticket2rw.enabledText"></strong></td><td><input type="checkbox" id="ticket2rw.enabled"></td></tr>'+
            '<tr><td><span id="ticket2rw.trainNumberText"></span></td><td><input type="text" id="ticket2rw.trainNumber"></td></tr>'+
            '<tr><td colspan="2"><span id="ticket2rw.categoryHeaderText"></span></td></tr>'+
            '<tr><td colspan="2" class="padLeft">'+
            '<div><input type="checkbox" id="ticket2rw.trackedCategories.0"> <span id="ticket2rw.categoryText.0"></span></div>'+
            '<div><input type="checkbox" id="ticket2rw.trackedCategories.1"> <span id="ticket2rw.categoryText.1"></span></div>'+
            '<div><input type="checkbox" id="ticket2rw.trackedCategories.2"> <span id="ticket2rw.categoryText.2"></span></div>'+
            '<div><input type="checkbox" id="ticket2rw.trackedCategories.3"> <span id="ticket2rw.categoryText.3"></span></div>'+
            '<div><input type="checkbox" id="ticket2rw.trackedCategories.4"> <span id="ticket2rw.categoryText.4"></span></div>'+
            '<div><input type="checkbox" id="ticket2rw.trackedCategories.5"> <span id="ticket2rw.categoryText.5"></span></div>'+
            '</td></tr>'+
            '<tr><td colspan="2"><input type="button" class="commandExButton" id="ticket2rw.button.ok" value="Save">'+
            '<input type="button" class="commandExButton" id="ticket2rw.button.close" value="Close"></table>';

        
        var windowDiv = document.createElement('div');
        windowDiv.id = 'ticket2rw';
        windowDiv.innerHTML = windowHtml;

        document.body.appendChild(windowDiv);

        //resolve the DOM elements now to cache them for later usage
        me.elements.enabled = document.getElementById('ticket2rw.enabled');
        me.elements.trainNumber = document.getElementById('ticket2rw.trainNumber');
        me.elements.trackedCategories = [];
        for (var i = 0; i < 6; i++) {
            me.elements.trackedCategories.push(document.getElementById('ticket2rw.trackedCategories.'+i));
        }
        me.elements.ok = document.getElementById('ticket2rw.button.ok');
        me.elements.close = document.getElementById('ticket2rw.button.close');
        me.elements.windowDiv = windowDiv;

        var link = document.createElement('a');
        link.href = '#';
        link.id = 'ticket2rw.showWindow';
        link.innerText = 'ticket2rw';
        var container = document.createElement('span');
        container.appendChild(link);

        me.elements.showWindow = link;

        document.getElementsByClassName('date')[0].appendChild(container);
    },

    injectCss: function() {
        var css = '#ticket2rw { display: none; z-index: 4242; background-color: white; border: 1px dashed #62aae1; position: absolute; left: 50%; width: 250px; margin-left: -125px; top: 50%; height: 200px; margin-top: -100px; padding: 20px; };' +
            '#ticket2rw table {width: 100%} #ticket2rw td.padLeft {padding-left: 20px}', 
            head = document.getElementsByTagName('head')[0],
            style = document.createElement('style');

        style.type = 'text/css';
        if (style.styleSheet){
          style.styleSheet.cssText = css;
        } else {
          style.appendChild(document.createTextNode(css));
        }

        head.appendChild(style);
    },

    setLocalization: function(){
        var me=this;
        document.getElementById('ticket2rw.enabledText').innerText = me.localization.enabled;
        document.getElementById('ticket2rw.trainNumberText').innerText = me.localization.trainNumber;
        document.getElementById('ticket2rw.categoryHeaderText').innerText = me.localization.categoryHeader;
        document.getElementById('ticket2rw.trainNumberText').innerText = me.localization.trainNumber;
        for (var i = 0; i < me.localization.ticketCategories.length; i++) {
            document.getElementById('ticket2rw.categoryText.'+i).innerText = 
                me.localization.ticketCategories[i];
        }
        me.elements.ok.value = me.localization.ok;
        me.elements.close.value = me.localization.close;

    },

    setEvents: function() {
        var me=this;
            

        me.elements.showWindow.onclick = function() {
            //show window
            me.elements.windowDiv.style.display = 'block';
        };

        me.elements.ok.onclick = function() {
            //save the config and enable/disable the processing
            var config = me.getConfig();
            me.saveConfig();
            me.elements.windowDiv.style.display = 'none';
            me.setEnabled(config.enabled);
        };

        me.elements.close.onclick = function() {
            me.elements.windowDiv.style.display = 'none';
        };

    },

    getConfig: function(){
        var me = this,
            config = me.loadConfig();
        config.enabled = me.elements.enabled.checked;
        config.trainNumber = me.elements.trainNumber.value;
        for (var i = 0; i < 6; i++) {
            config.trackedCategories[i] = me.elements.trackedCategories[i].checked;    
        }
        return config;
    },

    setEnabled: function(enabled) {
        var me = this,
            linkStyle = me.elements.showWindow.style;
        if (enabled) {
            linkStyle.fontWeight = 'bold';
            linkStyle.color = '#22e322';
        } else {
            linkStyle.fontWeight = '';
            linkStyle.color = '';
        }

        me.doProcessing(enabled);
    },

    setFields: function(config) {
        var me=this;
        me.config = config;
        me.elements.enabled.checked = config.enabled;
        me.elements.trainNumber.value = config.trainNumber;
        for (var i = 0; i < 6; i++) {
            me.elements.trackedCategories[i].checked = config.trackedCategories[i];
        }
    },


    init: function(){
        var me=this,
            config = me.loadConfig();
            
        window.ticket2rw = me;    
        
        me.injectCss();
        me.injectHtml();
        me.setLocalization(); 
        me.setFields(config);
        me.setEvents(); 

        me.setEnabled(config.enabled);
    },

    doProcessing: function(enabled){
        var me=this,
            gotTickets;

        if (!enabled) {
            //if we are disabled, clear the timeout variable to prevent a final reload
            clearTimeout(me.timeoutVar);
            return;
        }

        gotTickets = me.getTickets();

        if (gotTickets && me.checkTickets()) {
            //do nothing - the tickets are found

        } else {
            //schedule refreshing of the page
            me.timeoutVar = setTimeout(me.reloadPage, me.config.refreshInterval*1000);
        }
    }
};

ticket2rw.init();