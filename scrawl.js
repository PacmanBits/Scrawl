/*
//////////////////////////////////////////////////
//                                              //
//                                              //
//    Scrawl                 Sanford Gifford    //
//    v2.0                   August 18, 2015    //
//                                              //
//                                              //
//////////////////////////////////////////////////
*/

(function($)
{
	var defaultOptions = {
		hThumbClassName     : "hScrawlThumb" ,
		hScrollbarClassName : "hScrawlBar"   ,
		vThumbClassName     : "vScrawlThumb" ,
		vScrollbarClassName : "vScrawlBar"   ,
		showScrollbar       : true           ,
		fixedThumbSize      : false          ,
		listenForWinResize  : true
	};
	
	var scrawlNumber = 0          ;
	var ID_KEY       = "ScrawlID" ;
	var scrawls      = {}         ;
	var body         = null       ;
	var pad          = 100        ; // this padding value is used to offset the inner div in ALL cases.  This covers browsers who's scrollbars don't take up screen real-estate, but draw over the screen
	var padUnit      = pad + "px" ;
	
	
	
	$(function()
	{
		body = $("body");
	});
	
	function makeEl(tagname)
	{
		return $(document.createElement(tagname));
	}
	
	function makeDiv()
	{
		return makeEl("div");
	}
	
	function turnOffDocumentSelect()
	{
		body.css({
			"-moz-user-select"    : "none" ,
			"-webkit-user-select" : "none" ,
			"-o-user-select"      : "none" ,
			"user-select"         : "none"
		});
	}
	
	function turnOnDocumentSelect()
	{
		body.css({
			"-moz-user-select"    : "auto" ,
			"-webkit-user-select" : "auto" ,
			"-o-user-select"      : "auto" ,
			"user-select"         : "auto"
		});
	}
	
	$.fn.scrawlResize = function()
	{
		this.each(function()
		{
			var scrawl = scrawls[$(this).data(ID_KEY)];
			resize(scrawl);
		});
		
		return this;
	};
	
	function resize(scrawl)
	{
		var vBarSize = scrawl.el.inner.width()  - scrawl.el.sizer.width()  ;
		var hBarSize = scrawl.el.inner.height() - scrawl.el.sizer.height() ;
		console.log(vBarSize + ", " + hBarSize);
		scrawl.el.inner.css({
			paddingRight  : 100 - vBarSize + "px" ,
			paddingBottom : 100 - hBarSize + "px"
		});
	}
	
	function Bar(horizontal, scrawl)
	{
		var me = this;
		
		var cnPrefix = (horizontal ? "h" : "v");
		
		var bar   = makeDiv()
			.addClass(scrawl.opts[cnPrefix + "ScrollbarClassName"])
			.appendTo(scrawl.el.outer);
		
		var thumb = makeDiv()
			.addClass(scrawl.opts[cnPrefix + "ThumbClassName"])
			.appendTo(bar);
		
		var resizeConsts = {};
		
		
		// ***** BEGIN Resize/Scroll listeners *****
		
		this.resize = (horizontal ? // Maybe the worst bastardization of ternaries I've ever had the pleasure of using.  Removes conditional logic in a function that can be called on a per-frame basis.
			function()
			{
				var scrollWidth = scrawl.el.inner[0].scrollWidth - 2 * pad ;
				var innerWidth  = scrawl.el.inner.width()                  ;
				
				thumb.css("width", 100 * innerWidth / scrollWidth + "%");
				
				resizeConsts.scrollMaxTravel = scrollWidth - innerWidth    ;
				resizeConsts.thumbMaxTravel  = bar.width() - thumb.width() ;
				resizeConsts.scrollbarStart  = bar.offset().left           ;
			}
			:
			function()
			{
				var scrollHeight = scrawl.el.inner[0].scrollHeight - 2 * pad ;
				var innerHeight  = scrawl.el.inner.height()                  ;
				
				thumb.css("height", 100 * innerHeight / scrollHeight + "%");
				
				resizeConsts.scrollMaxTravel = scrollHeight - innerHeight    ;
				resizeConsts.thumbMaxTravel  = bar.height() - thumb.height() ;
				resizeConsts.scrollbarStart  = bar.offset().top              ;
			}
		);
		
		this.scrollCheck = (horizontal ?
			function()
			{
				var scrollLoc = resizeConsts.thumbMaxTravel * scrawl.el.inner.scrollLeft() / resizeConsts.scrollMaxTravel;
				thumb.css({
					left : scrollLoc + "px"
				});
			}
			:
			function()
			{
				var scrollLoc = resizeConsts.thumbMaxTravel * scrawl.el.inner.scrollTop() / resizeConsts.scrollMaxTravel;
				thumb.css({
					top : scrollLoc + "px"
				});
			}
		);
		
		// ***** END Resize/Scroll listeners *****
		// ***** BEGIN Enable/Disable *****
		
		this.enable = function()
		{
			bar.show();
			
			if(scrawl.opts.listenForWinResize)
				$(window).bind("resize", me.resize);
			
			$(window).bind("resize", me.scrollCheck);
			scrawl.el.inner.bind("scroll", me.scrollCheck);
			
			this.resize();
		};
		
		this.disable = function()
		{
			$(window).unbind("resize", me.resize)            ;
			$(window).unbind("resize", me.scrollCheck)       ;
			scrawl.el.inner.unbind("scroll", me.scrollCheck) ;
			
			bar.hide();
		};
		
		// ***** END Enable/Disable *****
		// ***** BEGIN Mouse dragging *****
		
		var downPoint = 0;
		var downScroll = 0;
		
		
		var setScrollByPercent = (horizontal ?
			function (percent)
			{
				scrawl.el.inner.scrollLeft(percent * resizeConsts.scrollMaxTravel);
			}
			:
			function (percent)
			{
				scrawl.el.inner.scrollTop(percent * resizeConsts.scrollMaxTravel);
			}
		);
		
		function mouseUp(e)
		{
			turnOnDocumentSelect();
			
			$(document).unbind("mouseup", mouseUp);
			$(document).unbind("mousemove", mouseMove);
		}
		
		var mouseMove = (horizontal ?
			function(e)
			{
				var movePercent = (e.pageX - resizeConsts.scrollbarStart - downPoint) / resizeConsts.thumbMaxTravel;
				
				setScrollByPercent(movePercent + downScroll);
			}
			:
			function(e)
			{
				var movePercent = (e.pageY - resizeConsts.scrollbarStart - downPoint) / resizeConsts.thumbMaxTravel;
				
				setScrollByPercent(movePercent + downScroll);
			}
		);
		
		var mouseDown = (horizontal ?
			function(e)
			{
				turnOffDocumentSelect();
				
				downPoint  = e.pageX - resizeConsts.scrollbarStart             ;
				downScroll = scrawl.el.inner.scrollLeft() / resizeConsts.scrollMaxTravel ;
				
				$(document).bind("mouseup", mouseUp)     ;
				$(document).bind("mousemove", mouseMove) ;
			}
			:
			function(e)
			{
				turnOffDocumentSelect();
				
				downPoint  = e.pageY - resizeConsts.scrollbarStart            ;
				downScroll = scrawl.el.inner.scrollTop() / resizeConsts.scrollMaxTravel ;
				
				$(document).bind("mouseup", mouseUp)     ;
				$(document).bind("mousemove", mouseMove) ;
			}
		);
		
		thumb.mousedown(mouseDown);
		
		// ***** END Mouse dragging *****
		
		this.enable();
	}
	
	$.fn.scrawl = function(options)
	{
		this.each(function()
		{
			var targ = $(this);
			
			scrawlNumber++;
			
			var scrawl = {};
			
			scrawl.opts = $.extend({}, defaultOptions, options);
			
			targ.data(ID_KEY, scrawlNumber);
			scrawls[scrawlNumber] = scrawl;
			
			scrawl.el = {};
			
			scrawl.el.outer = targ
				.css({
					overflow : "hidden"
				});
			
			scrawl.el.sizer = makeDiv()
				.css({
					position : "absolute" ,
					top      : padUnit    ,
					left     : padUnit    ,
					right    : padUnit    ,
					bottom   : padUnit
				});
			
			scrawl.el.inner = makeDiv()
				.css({
					position : "absolute"    ,
					overflow : "auto"        ,
					top      : "-" + padUnit ,
					left     : "-" + padUnit ,
					right    : "-" + padUnit ,
					bottom   : "-" + padUnit ,
					padding  : padUnit
				})
				.append(scrawl.el.sizer)
				.append(targ.contents());
			
			targ.append(scrawl.el.inner);
			
			scrawl.bar = {
				vert : new Bar(false, scrawl) ,
				horz : new Bar(true,  scrawl)
			};
			
			if(scrawl.opts.listenForWinResize)
			{
				$(window).bind("resize", function()
				{
					resize(scrawl);
				});
			}
			
			resize(scrawl);
		});
		
		return this;
	};
})(jQuery)
