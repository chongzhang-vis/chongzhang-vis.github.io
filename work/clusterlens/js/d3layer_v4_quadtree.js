// based on ArcGIS API for JavaScript 3.30
// @author Chong Zhang.
// Please contact me at chongzhang.nc@gmail.com if you have any questions
define(["dojo/_base/declare","esri/geometry/Point","dojo/_base/lang","esri/layers/GraphicsLayer","esri/geometry/screenUtils","esri/geometry/webMercatorUtils","/share/js/d3.v4.js"],function(t,e,r,i,s,n,a){return i.createSubclass({constructor:function(t,e){this.url=t,this.callback=e.callback||function(){},this.svg_type=e.svgType||"path",this.id=e.id||Date.now().toString(16),this._styles=e.style||{},this._attrs=e.attr||{},this._svg_layer_sel="#"+this.id+"_layer";const r=e.colorScale0||"#feebe2",i=e.colorScale1||"#dd1c77";this.colorScale=a.scaleLinear().range([r,i]),this.secell=32,this.unitRadius=4,this.rawPoints=e.rawPoints,this._parentMap=e.parentMap,this.curLOD=e.LOD||0,this._LOD=[0,1,2,3,4,5],this._LOD2Depth=[4,5,6,7,8,9],this._zoom2LOD=e.zoom2LOD||{10:[1,2,3,4,5,6,7],11:[2,3,4,5,6,7],12:[3,4,5,6,7,8],13:[4,5,6,7,8],14:[5,6,7,8,9],15:[6,7,8,9],16:[8,9,10]}},_setMap:function(t,e){var i=this;return this.curZoom=t.getZoom(),a.json(i.url,function(t){if(i.geoFeatures=t,i.bbox=a.geoBounds(t),i.loaded=!0,i._render(),i.onLoad(i),i.callback(t),i._map.container.style.left){const t=[-i._map.container.offsetLeft,-i._map.container.offsetTop];i.getSVGFeatureGroupSelection().attr("transform","translate("+t[0]+","+t[1]+")")}i.initTranslate=[-i._map.container.offsetLeft,-i._map.container.offsetTop]}),this.mapWidth=t.width,this.mapHeight=t.height,this._parentMap&&(this.parentMapWidth=this._parentMap.width,this.parentMapHeight=this._parentMap.height),this._redraw=t.on("zoom-end",r.hitch(this,function(t){this.rawPoints||(this.startClusterPerZoom=this._initClusteringArray(this.geoFeatures.features),this._createQuadTree(),this.restoreStatus||(this.curLOD=this.curLOD+1),this.restoreStatus=!1),this.redraw()})),t.on("click",r.hitch(this,function(t){const e=this._map.getZoom(),r=this._zoom2LOD[e];if(this.curLOD===r[r.length-1])return this.setVisibility(!1),void(this.curLOD=r[0]);this.curLOD=this.curLOD+1,this.setVisibility(!0),this.redraw()})),this._path_draw=a.geoPath().projection(a.geoMercator().scale((this.mapWidth+1)/2/Math.PI).translate([this.mapWidth/2,this.mapHeight/2]).precision(.1)),this.inherited(arguments)},_unsetMap:function(){this.inherited(arguments),this._redraw.remove()},resetCenter:function(){this.getSVGFeatureGroupSelection().attr("transform","translate("+this.initTranslate[0]+","+this.initTranslate[1]+")")},attr:function(t){return("data-suspended"!=t||this.suspended)&&this.getSVGFeatureSelections().attr(t.key,t.value),this.inherited(arguments)},restore:function(t,e){this.restoreStatus=!0,this.curLOD=e;const r=this._zoom2LOD[t];t!==this._map.getZoom()&&(this.startClusterPerZoom=null,this._createQuadTree()),e!==r[r.length-1]?(this.setVisibility(!0),this.redraw()):this.setVisibility(!1)},_createQuadTree:function(){this.startClusterPerZoom||(this.startClusterPerZoom=this._initClusteringArray(this.geoFeatures.features));var t=a.quadtree().x(function(t){return t.x}).y(function(t){return t.y}).addAll(this.startClusterPerZoom);this.quadtree=t},_render:function(){const t=this._map.getZoom();let e;this.rawPoints||(e=this._zoom2LOD[t]);var r=this,i=this.getSVGFeatureGroupSelection();if(this.rawPoints){var s=i.selectAll("circle").data(this.geoFeatures.features).enter().append(this.svg_type).attr("r",function(t){return t.r});for(attrName in"path"!==this.svg_type&&s.attr("transform",function(t){return"translate("+r._project_to_screen1(t.geometry.coordinates)[0]+","+r._project_to_screen1(t.geometry.coordinates)[1]+")"}),this._attrs)s.attr(attrName,this._attrs[attrName]);for(styleName in s.attr("class",function(t,e){return a.select(this).attr("class")+" "+r.id}),this._styles)s.style(styleName,this._styles[styleName])}else if(this.quadtree||this._createQuadTree(),this.quadtreeNodes=this._nodes(this.quadtree),this.curLOD===e[1]){var n=this.clustering(this.quadtree);(s=i.selectAll("circle").data(n,function(t){return t?r.curLOD+1+"_"+Math.floor(t.x)+"_"+Math.floor(t.y)+"_"+t.r+"_"+t.index:"null"})).attr("transform",function(t){return"translate("+t.x+","+t.y+")"}).attr("r",function(t){return t.r});var o=s.enter().append("circle").attr("transform",function(t){return"translate("+t.x+","+t.y+")"}).attr("r",function(t){return t.r});for(attrName in this._attrs)o.attr(attrName,this._attrs[attrName]);for(styleName in o.attr("class",function(t,e){return a.select(this).attr("class")+" cluster "}),this._styles)o.style(styleName,this._styles[styleName]);s.exit().remove()}else{if(this.curLOD===e[0])return this.setVisibility(!1),void(this.visible=!1);const s=r.quadtreeNodes.filter(t=>t.size>0&&t.width<128),n=this._getNextLevelQuadLeaves(s,this.curLOD,t),o=[],c=a.extent(n,t=>t.size),u=a.extent(o,t=>t.size),l=a.extent(c.concat(u));r.colorScale.domain(l),i.selectAll(".leafGrid").data(n,t=>t.depth+"_"+t.x+"_"+t.y).enter().append("rect").attr("class","leafGrid").attr("x",function(t){return t.x}).attr("y",function(t){return t.y}).attr("width",function(t){return t.width}).attr("height",function(t){return t.height}).style("fill",function(t){return r.colorScale(t.size)}),i.selectAll(".upperGrid").data(o,t=>t.depth+"_"+t.x+"_"+t.y).enter().append("rect").attr("class","upperGrid").attr("x",function(t){return t.x}).attr("y",function(t){return t.y}).attr("width",function(t){return t.width}).attr("height",function(t){return t.height}).style("fill",function(t){return r.colorScale(t.size)})}},_nodes:function(t){t.root().depth=0,t.visitAfter(function(t){return null==t.length?t.size=1:t.size=a.sum(t,function(t){return null!=t?t.size:0})});var e=[];return t.visit(function(t,r,i,s,n){t.hasChild=!1;for(var a=0;a<4;a++)t[a]&&(t[a].depth=t.depth+1,t.hasChild=!0);e.push({x:r,y:i,width:s-r,height:n-i,size:t.size,depth:t.depth,hasChild:t.hasChild})}),e},redraw:function(){const t=this._map.getZoom();var e=this,r=this.getSVGFeatureGroupSelection();if(this.curZoom!==t&&(this.curZoom=t,e._map.container.offsetLeft)){const t=-1*+e._map.container.offsetLeft,r=-1*+e._map.container.offsetTop;e.getSVGFeatureGroupSelection().attr("transform","translate("+t+","+r+")")}if(this.rawPoints)"path"!=this.svg_type&&r.selectAll("circle").attr("transform",function(t){return"translate("+e._project_to_screen1(t.geometry.coordinates)[0]+","+e._project_to_screen1(t.geometry.coordinates)[1]+")"});else if("path"!=this.svg_type){const n=this._zoom2LOD[t];if(this.quadtree||this._createQuadTree(),this.curLOD===n[1]){r.selectAll("rect").remove();const t=this.clustering(this.quadtree);this.quadtree.display="circle",this.quadtreeNodes=this._nodes(this.quadtree);var i=r.selectAll("circle").data(t,function(t){return t?e.curLOD+1+"_"+Math.floor(t.x)+"_"+Math.floor(t.y)+"_"+t.r+"_"+t.index:"null"});i.attr("transform",function(t){return"translate("+t.x+","+t.y+")"}).attr("r",function(t){return t.r});var s=i.enter().append("circle").attr("transform",function(t){return"translate("+t.x+","+t.y+")"}).attr("r",function(t){return t.r});for(attrName in this._attrs)s.attr(attrName,this._attrs[attrName]);for(styleName in s.attr("class",function(t,e){return a.select(this).attr("class")+" cluster "}),this._styles)s.style(styleName,this._styles[styleName]);i.exit().remove()}else{this.quadtree.display="rect",this.quadtreeNodes=this._nodes(this.quadtree),r.selectAll("circle").remove();const i=this.quadtreeNodes.filter(t=>t.size>0&&t.width<128),s=this._getNextLevelQuadLeaves(i,e.curLOD,t),n=[],o=a.extent(s,t=>t.size),c=a.extent(n,t=>t.size),u=a.extent(o.concat(c));e.colorScale.domain(u);const l=r.selectAll(".leafGrid").data(s,t=>t.depth+"_"+t.x+"_"+t.y+"_"+t.width);l.exit().remove(),l.enter().append("rect").attr("class","leafGrid").attr("x",function(t){return t.x}).attr("y",function(t){return t.y}).attr("width",function(t){return t.width}).attr("height",function(t){return t.height}).style("fill",function(t){return e.colorScale(t.size)});const h=r.selectAll(".upperGrid").data(n,t=>t.depth+"_"+t.x+"_"+t.y+"_"+t.width);h.exit().remove(),h.enter().append("rect").attr("class","upperGrid").attr("x",function(t){return t.x}).attr("y",function(t){return t.y}).attr("width",function(t){return t.width}).attr("height",function(t){return t.height}).style("fill",function(t){return e.colorScale(t.size)})}}else this.getSVGFeatureSelections().attr("d",e._path_draw)},_getNextLevelQuadLeaves:function(t,e,r){return t.filter(t=>t.depth===e)},getSVGLayerSelector:function(){return this._svg_layer_sel},getSVGFeatureSelections:function(){return a.select(this._svg_layer_sel).selectAll(this.svg_type)},getSVGFeatureGroupSelection:function(){return a.select(this._svg_layer_sel).select("g")},_project_to_screen1:function(t){var r=new e(t[0],t[1]),i=this._map.toScreen(r);return[i.x,i.y]},_project_to_screen:function(t){const e=n.lngLatToXY(t[0],t[1]);var r=this._parentMap.toScreen({x:e[0],y:e[1]});return[r.x,r.y]},_initClusteringArray:function(t){var e=this;return t.map(function(t,r){var i=e._project_to_screen(t.geometry.coordinates);return{x:i[0],y:i[1],r:e.unitRadius,points:[{...t,scrCoordinates:i}]}})},_averageClusters:function(t,e){var r=e.r/(t.r+e.r);return{x:t.x+r*(e.x-t.x),y:t.y+r*(e.y-t.y),r:this.unitRadius*Math.log(t.points.length+e.points.length)*2,points:t.points.concat(e.points)}},clustering:function(t){function e(t,e,r,i,s){var n=[];return t.visit(function(t,a,o,c,u){var l=t.data;return l&&(l.selected=l.x>=e&&l.x<i&&l.y>=r&&l.y<s,l.selected&&n.push(l)),a>=i||o>=s||c<e||u<r}),n}var r=this,i=[];const[[s,n],[o,c]]=t.extent();for(var u=s;u<=o;u+=r.secell)for(var l=n;l<=c;l+=r.secell){var h=e(t,u,l,u+r.secell,l+r.secell);h.length&&i.push(h.reduce(r._averageClusters.bind(r)))}var d=a.max(i,function(t){return t.r}),f=!0;for(i.map(function(t,e){return t.index=e,t});f;){f=!1;var _=[];a.voronoi().x(function(t){return t.x+Math.random()-.5}).y(function(t){return t.y+Math.random()-.5}).links(i.filter(function(t){return!!t})).map(function(t){var e=t.source.x-t.target.x,r=t.source.y-t.target.y;t.distance=Math.sqrt(e*e+r*r),_.push(t)}),_.sort(function(t,e){return t.distance-e.distance}),_.every(function(t){if(t.distance>2*d)return!1;if(t.distance<t.source.r+t.target.r){f=!0;var e=r._averageClusters(t.source,t.target);return e.index=t.source.index,i[t.target.index]=null,i[t.source.index]=e,d=Math.max(d,e.r),!1}return!0})}return i.filter(function(t){return null!==t})}})});
