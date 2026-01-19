import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { GamesProvider } from "@/lib/games-context";
import { MediaProvider } from "@/lib/media-context";
import { GlobalAuth } from "@/components/GlobalAuth";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"),
  title: "YBA Gametime",
  description: "Game results, photos, and videos for YBA Basketball and Football",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        {/* SentryVibe HMR Proxy - intercepts HMR WebSocket for remote preview */}
        <Script id="sentryvibe-hmr-proxy" strategy="beforeInteractive">{`
          (function(){if(window===window.parent)return;if(window.__sentryvibeHmrProxyInit)return;window.__sentryvibeHmrProxyInit=true;var O=window.WebSocket,C=new Map,devPort=null,pending=[];function F(url,protocols){this.url=url;this.protocols=protocols;this.readyState=WebSocket.CONNECTING;this.bufferedAmount=0;this.extensions='';this.protocol=Array.isArray(protocols)?protocols[0]:(protocols||'');this.binaryType='blob';this.onopen=null;this.onclose=null;this.onmessage=null;this.onerror=null;this._listeners={open:[],close:[],message:[],error:[]};this._connectionId='hmr-'+Math.random().toString(36).substring(2,11);C.set(this._connectionId,this);this._requestConnect();}F.prototype._requestConnect=function(){var port=devPort;if(port===null){try{var u=new URL(this.url);var p=parseInt(u.port,10);if(p&&p!==80&&p!==443)port=p;}catch(e){}}if(port===null||port===80||port===443){console.warn('[HMR Proxy] Cannot determine dev server port - HMR disabled for remote preview. URL:',this.url);pending.push(this);return;}window.parent.postMessage({type:'sentryvibe:hmr:connect',connectionId:this._connectionId,port:port,protocol:this.protocol},'*');};F.prototype.send=function(data){if(this.readyState!==WebSocket.OPEN)throw new DOMException('WebSocket is not open','InvalidStateError');window.parent.postMessage({type:'sentryvibe:hmr:send',connectionId:this._connectionId,message:typeof data==='string'?data:JSON.stringify(data)},'*');};F.prototype.close=function(code,reason){if(this.readyState===WebSocket.CLOSING||this.readyState===WebSocket.CLOSED)return;this.readyState=WebSocket.CLOSING;window.parent.postMessage({type:'sentryvibe:hmr:disconnect',connectionId:this._connectionId,code:code||1000,reason:reason||''},'*');C.delete(this._connectionId);};F.prototype.addEventListener=function(type,listener){if(this._listeners[type])this._listeners[type].push(listener);};F.prototype.removeEventListener=function(type,listener){if(this._listeners[type]){var idx=this._listeners[type].indexOf(listener);if(idx!==-1)this._listeners[type].splice(idx,1);}};F.prototype.dispatchEvent=function(event){var listeners=this._listeners[event.type]||[];listeners.forEach(function(l){l.call(this,event);},this);var handler=this['on'+event.type];if(handler)handler.call(this,event);return true;};F.CONNECTING=0;F.OPEN=1;F.CLOSING=2;F.CLOSED=3;Object.defineProperty(F.prototype,'CONNECTING',{value:0});Object.defineProperty(F.prototype,'OPEN',{value:1});Object.defineProperty(F.prototype,'CLOSING',{value:2});Object.defineProperty(F.prototype,'CLOSED',{value:3});window.addEventListener('message',function(e){var d=e.data;if(!d||typeof d!=='object')return;if(d.type==='sentryvibe:hmr:connected'){var ws=C.get(d.connectionId);if(ws){ws.readyState=WebSocket.OPEN;ws.dispatchEvent(new Event('open'));}}else if(d.type==='sentryvibe:hmr:message'){var ws=C.get(d.connectionId);if(ws&&ws.readyState===WebSocket.OPEN){var evt=new MessageEvent('message',{data:d.message});ws.dispatchEvent(evt);}}else if(d.type==='sentryvibe:hmr:disconnected'){var ws=C.get(d.connectionId);if(ws){ws.readyState=WebSocket.CLOSED;ws.dispatchEvent(new CloseEvent('close',{code:d.code||1000,reason:d.reason||''}));C.delete(d.connectionId);}}else if(d.type==='sentryvibe:hmr:error'){var ws=C.get(d.connectionId);if(ws){ws.dispatchEvent(new Event('error'));}}else if(d.type==='sentryvibe:dev-port'){devPort=d.port;pending.forEach(function(ws){ws._requestConnect();});pending=[];}});window.WebSocket=F;})();
        `}</Script>
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          <GamesProvider>
            <MediaProvider>
              <GlobalAuth />
              {children}
              <Toaster position="bottom-right" />
            </MediaProvider>
          </GamesProvider>
        </AuthProvider>
        {/* SentryVibe Selection Script - enables element selection in preview */}
        <Script id="sentryvibe-selection" strategy="afterInteractive">{`
          (function() {
            let isInspectorActive = false;
            let inspectorStyle = null;
            let highlightedElement = null;
            let highlightOverlay = null;
            let mouseHandler = null;
            let clickHandler = null;

            function createHighlightOverlay() {
              if (highlightOverlay) return highlightOverlay;
              const overlay = document.createElement('div');
              overlay.id = '__sentryvibe-highlight';
              overlay.style.cssText = 'position: absolute; pointer-events: none; border: 2px solid #7553FF; background: rgba(117, 83, 255, 0.1); z-index: 999999; transition: all 0.1s ease; box-shadow: 0 0 0 1px rgba(117, 83, 255, 0.3), 0 0 20px rgba(117, 83, 255, 0.4);';
              document.body.appendChild(overlay);
              highlightOverlay = overlay;
              return overlay;
            }

            function removeHighlightOverlay() {
              if (highlightOverlay) { highlightOverlay.remove(); highlightOverlay = null; }
            }

            function highlightElement(element) {
              if (!element || !isInspectorActive) { removeHighlightOverlay(); return; }
              const rect = element.getBoundingClientRect();
              const overlay = createHighlightOverlay();
              overlay.style.left = rect.left + window.scrollX + 'px';
              overlay.style.top = rect.top + window.scrollY + 'px';
              overlay.style.width = rect.width + 'px';
              overlay.style.height = rect.height + 'px';
              highlightedElement = element;
            }

            function generateSelector(element) {
              const testId = element.getAttribute('data-testid');
              if (testId) return '[data-testid="' + testId + '"]';
              if (element.id) return '#' + element.id;
              const classes = Array.from(element.classList).filter(c => !c.match(/^(hover:|focus:|active:|group-|animate-|transition-)/) && !c.includes(':')).slice(0, 3).join('.');
              if (classes) {
                const tagName = element.tagName.toLowerCase();
                try {
                  const selector = tagName + '.' + classes;
                  const matches = document.querySelectorAll(selector);
                  if (matches.length === 1) return selector;
                  const parent = element.parentElement;
                  if (parent) { const siblings = Array.from(parent.children); const index = siblings.indexOf(element) + 1; return selector + ':nth-child(' + index + ')'; }
                  return selector;
                } catch (err) {}
              }
              return getFullPath(element);
            }

            function getFullPath(element) {
              const path = [];
              let current = element;
              while (current && current !== document.body) {
                let selector = current.tagName.toLowerCase();
                if (current.id) { selector += '#' + current.id; path.unshift(selector); break; }
                const parent = current.parentElement;
                if (parent) { const siblings = Array.from(parent.children).filter(child => child.tagName === current.tagName); if (siblings.length > 1) { const index = siblings.indexOf(current) + 1; selector += ':nth-of-type(' + index + ')'; } }
                path.unshift(selector);
                current = current.parentElement;
              }
              return path.join(' > ');
            }

            function captureElementData(element, clickEvent) {
              const rect = element.getBoundingClientRect();
              return {
                selector: generateSelector(element),
                tagName: element.tagName.toLowerCase(),
                className: element.className,
                id: element.id,
                textContent: element.textContent?.trim().slice(0, 100),
                innerHTML: element.innerHTML?.slice(0, 200),
                attributes: Array.from(element.attributes).reduce((acc, attr) => { acc[attr.name] = attr.value; return acc; }, {}),
                boundingRect: { top: rect.top, left: rect.left, width: rect.width, height: rect.height },
                clickPosition: { x: clickEvent.clientX, y: clickEvent.clientY },
                computedStyles: { backgroundColor: window.getComputedStyle(element).backgroundColor, color: window.getComputedStyle(element).color, fontSize: window.getComputedStyle(element).fontSize, fontFamily: window.getComputedStyle(element).fontFamily }
              };
            }

            function handleMouseMove(e) { if (!isInspectorActive) return; const element = e.target; if (element && element !== highlightedElement) highlightElement(element); }

            function handleClick(e) {
              if (!isInspectorActive) return;
              e.preventDefault(); e.stopPropagation();
              const element = e.target;
              const data = captureElementData(element, e);
              window.parent.postMessage({ type: 'sentryvibe:element-selected', data }, '*');
              setInspectorActive(false);
            }

            function setInspectorActive(active) {
              isInspectorActive = active;
              if (active) {
                if (!inspectorStyle) { inspectorStyle = document.createElement('style'); inspectorStyle.textContent = '.inspector-active * { cursor: crosshair !important; }'; document.head.appendChild(inspectorStyle); }
                document.body.classList.add('inspector-active');
                if (!mouseHandler) { mouseHandler = handleMouseMove; clickHandler = handleClick; document.addEventListener('mousemove', mouseHandler, true); document.addEventListener('click', clickHandler, true); }
              } else {
                document.body.classList.remove('inspector-active');
                highlightedElement = null;
                removeHighlightOverlay();
                if (mouseHandler) { document.removeEventListener('mousemove', mouseHandler, true); document.removeEventListener('click', clickHandler, true); mouseHandler = null; clickHandler = null; }
                if (inspectorStyle) { inspectorStyle.remove(); inspectorStyle = null; }
              }
            }

            window.addEventListener('message', (e) => { if (e.data.type === 'sentryvibe:toggle-selection-mode') setInspectorActive(e.data.enabled); });
            window.parent.postMessage({ type: 'sentryvibe:ready' }, '*');
          })();
        `}</Script>
      </body>
    </html>
  );
}
