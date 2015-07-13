/*
//////////////////////////////////////////////////
//                                              //
//                                              //
//    Scrawl                 Sanford Gifford    //
//    v1.0                      June 1, 2015    //
//                                              //
//                                              //
//////////////////////////////////////////////////

Custom scrollbar jQuery plug-in.  Unlike most
scrollbar replacement scripts, Scrawl uses the
browser's built in scroll functionality, making
sure that the user has the experience they're used
to, with the addition of custom styling.

To use Scrawl, call the "scrawl()" function on any
jQuery selection.  To recalculate the dimensions
of an element with Scrawl on it, use scrawlResize.
Additionally, a set of options may be passed to
scrawl():

	thumbClassName (string, default "scrawlThumb"):
		The class name for the scrollbar's thumb.
		Only used for styling, can be any valid
		class name.

	scrollbarClassName (string, default "scrawlBar"):
		The class name for the scrollbar.  Only
		used for styling, can be any valid class
		name.

	showScrollbar (boolean, default true):
		If set to false, no scrollbars will be
		shown.  The user may still use whatever
		hardware scrolling they normally would
		(mouse wheel, etc).

	fixedThumbSize (boolean, default false):
		If set to true, the scrollbar thumb will
		not resize based on the size of the
		scrollable area.

	listenForWinResize (boolean, default true):
		If set to true, every scrollbar in the set
		will automatically recalculate every time
		the window is resized.

Some suggestions:
	- Scrawl adds two extra divs between the
	  element it was called on and the content
	  inside of it.  Because of this, Scrawl
	  doesn't always play nicely with direct child
	  selectors in CSS.  Use them sparingly!
	  
	- listenForWinResize can be heavy on processor
	  cycles on pages where Scrawl is used a lot.
	  If you know an element isn't going to be
	  resized often, and that its content is
	  fixed, consider setting listenForWinResize
	  to false.  You can always manually call
	  scrawlResize on any element that has had
	  Scrawl used on it.

*/

/*
	Changes:
	
	1.0, Initial
		- Support for vertical scrollbars
		- Options include:
			- thumbClassName
			- scrollbarClassName
			- fixedThumbSize
			- listenForWinResize
		- jQuery functions include:
			- scrawl(options?)
			- scrawlResize()
*/

(function($)
{
	var defaultOptions = {
		thumbClassName     : "scrawlThumb" ,
		scrollbarClassName : "scrawlBar"   ,
		showScrollbar      : true          ,
		fixedThumbSize     : false         ,
		listenForWinResize : true
	};
	
	var scrawlNumber = 0          ;
	var ID_KEY       = "ScrawlID" ;
	var scrawls      = {}         ;
	var body         = null       ;
	
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
	
	function resizeBox(scrawl)
	{
		var widthDiv = makeDiv().appendTo(scrawl.els.innerDiv).css({ position : "absolute", top : 0, left : 0, width : "100%", height : "100%" });
		
		var scrollbarWidth  = scrawl.els.innerDiv.outerWidth() - widthDiv.width();
		
		widthDiv.remove();
		
		if(scrollbarWidth <= 0)
		{
			scrawl.els.scrollbar.css("display", "none" );
			scrawl.els.innerDiv.css("right", "0" );
			return false;
		}
		
		scrawl.els.scrollbar.css("display", "block" );
		scrawl.els.innerDiv.css("right", -1 * scrollbarWidth );
		return true;
	}
	
	function resizeScrollbar(scrawl)
	{
		var scrollHeight = scrawl.els.innerDiv[0].scrollHeight ;
		var innerHeight  = scrawl.els.innerDiv.height()        ;
		
		if(!scrawl.opts.fixedThumbSize)
			scrawl.els.thumb.css("height", 100 * innerHeight / scrollHeight + "%");
		
		scrawl.resizeConsts.scrollMaxTravel = scrollHeight - innerHeight                                ;
		scrawl.resizeConsts.thumbMaxTravel  = scrawl.els.scrollbar.height() - scrawl.els.thumb.height() ;
		scrawl.resizeConsts.scrollbarTop    = scrawl.els.scrollbar.offset().top                         ;
		
		return true;
	}
	
	function resize(scrawl)
	{
		resizeBox(scrawl);
		
		if(scrawl.opts.showScrollbar)
			resizeScrollbar(scrawl);
		
		scrawlCheck(scrawl);
	}
	
	function scrawlCheck(scrawl)
	{
		var scrollLoc = scrawl.resizeConsts.thumbMaxTravel * scrawl.els.innerDiv.scrollTop() / scrawl.resizeConsts.scrollMaxTravel;
		scrawl.els.thumb.css({
			top : scrollLoc + "px"
		});
	}
	
	$.fn.scrawlResize = function()
	{
		this.each(function()
		{
			var scrawl = scrawls[$(this).data(ID_KEY)];
			
			if(scrawl)
				resize(scrawl);
		});
		
		return this;
	}
	
	$.fn.scrawl = function(options)
	{
		this.each(function()
		{
			var target = $(this);
			
			var scrawl = {
				opts            : $.extend({}, defaultOptions, options),
				ID              : scrawlNumber,
				resizeConsts : {
					scrollMaxTravel : 0,
					thumbMaxTravel  : 0,
					scrollbarTop    : 0
				},
				els : {
					self      : target    ,
					innerDiv  : makeDiv() ,
					outerDiv  : makeDiv() ,
					scrollbar : makeDiv() ,
					thumb     : makeDiv()
				}
			};
			
			target.data(ID_KEY, scrawlNumber);
			scrawls[scrawlNumber] = scrawl;
			
			scrawlNumber++;
			
			scrawl.els.innerDiv
				.append(target.contents())
				.css({
					position  : "absolute" ,
					left      : 0          ,
					right     : 0          ,
					top       : 0          ,
					bottom    : 0          ,
					overflowY : "auto"     ,
					overflowX : "hidden"
				})
			;
			
			scrawl.els.outerDiv
				.append(scrawl.els.innerDiv)
				.appendTo(target)
				.css({
					position : "relative" ,
					height   : "100%"     ,
					width    : "100%"     ,
					overflow : "hidden"
				})
			;
			
			var isScrollable = resizeBox(scrawl);
			
			if(scrawl.opts.listenForWinResize)
			{
				$(window).resize(function()
				{
					resize(scrawl);
				});
			}
			
			if(!scrawl.opts.showScrollbar) // if we don't show the bar, don't waste the processor time on it
				return true;
			
			scrawl.els.scrollbar
				.addClass(scrawl.opts.scrollbarClassName)
				.appendTo(scrawl.els.outerDiv)
			;
			
			scrawl.els.thumb
				.addClass(scrawl.opts.thumbClassName)
				.appendTo(scrawl.els.scrollbar)
			;
			
			resizeScrollbar(scrawl)
			
			function setScrollByPercent(percent)
			{
				scrawl.els.innerDiv.scrollTop(percent * scrawl.resizeConsts.scrollMaxTravel);
			}
			
			scrawl.els.innerDiv.scroll(function()
			{
				scrawlCheck(scrawl);
			});
			
			var downPoint = 0;
			var downScroll = 0;
			
			function mouseUp(e)
			{
				turnOnDocumentSelect();
				
				$(document).unbind("mouseup", mouseUp);
				$(document).unbind("mousemove", mouseMove);
			}
			
			function mouseMove(e)
			{
				var movePercent = (e.pageY - scrawl.resizeConsts.scrollbarTop - downPoint) / scrawl.resizeConsts.thumbMaxTravel;
				
				setScrollByPercent(movePercent + downScroll);
			}
			
			scrawl.els.thumb.mousedown(function(e)
			{
				turnOffDocumentSelect();
				
				downPoint = e.pageY - scrawl.resizeConsts.scrollbarTop;
				downScroll = scrawl.els.innerDiv.scrollTop() / scrawl.resizeConsts.scrollMaxTravel;
				
				$(document).bind("mouseup", mouseUp);
				$(document).bind("mousemove", mouseMove);
			});
		});
		
		return this;
	};
})(jQuery)
