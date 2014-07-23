// JavaScript Document

//HTMLブロックの取得
var idContainer = d3.select("#container");
var idGui = d3.select("#gui");
var idChart = d3.select("#chart");
var idCaption = d3.select("#caption");

//グローバル変数の設定
var margin = {top: 40, right: 40, bottom: 60, left: 120},
width = 960 - margin.left - margin.right;
height = 500 - margin.top - margin.bottom;

//ブラウザレベルのインターフェース、レスポンシブ設定
//setBrowserInterface();

//データセットの読み込み（可視化データ、地図データ、その他）
//例	queue()
//    		.defer(d3.json, "JSONファイル")
//    		.defer(d3.csv, "CSVファイル")
//    		.await(読み込み後実行関数);
queue()
	.defer(d3.csv, "dataset/salary_utf8.csv")
    .await(prep);

function prep(error, data1) {
	//error					エラーメッセージ
	//data1, data2, ...データセット
	
	//GUIの設定
		//ボタン
		//スライダ
		//その他

	//SVG要素の追加
	var svgChart = idChart.append("svg")
								.attr("width", width+margin.left+margin.right)
								.attr("height", height+margin.top+margin.bottom)
								.append("g")
								.attr("transform", "translate(" + margin.left + "," + margin.top + ")")
								;
	
	//軸とスケールの設定
	var xScale = d3.scale.log().range([0,width]).domain([10, 20000]);
	var xAxis  = d3.svg.axis().scale(xScale)
								.orient("bottom")
								.ticks(2, ",.1s").tickSize(6, 0);
	var yScale = d3.scale.linear().range([height,0]).domain([0, 10000]).nice();
	var yAxis  = d3.svg.axis().scale(yScale)
								.orient("left");
	var category = d3.scale.ordinal()
		.domain(["NV","SM","MG","SE","OM","AF"])
		.range([0,1,2,3,4,5]);	//インデックス番号
	//var color = ["#51a7f9", "#6fbf40","#b369e1","#999999","#f3901a","c82505"];	//Apple Keynote Color
	var color = ["#2980B9","#F39C12", "#27AE60","#7F8C8D","#8E44AD","#C0392B"];	//FLAT UI
	
	//X軸
	svgChart.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + height + ")")
      .call(xAxis)
    .append("text")
      .attr("class", "label")
      .attr("x", width*0.5)
      .attr("y", 40)
      .style("text-anchor", "middle")
      .text("従業員数（人）");

  svgChart.append("g")
      .attr("class", "y axis")
      .call(yAxis)
    .append("text")
      .attr("class", "label")
      .attr("transform", "rotate(-90)")
	  .attr("x",-height*0.4)
      .attr("y", -90)
      .attr("dy", ".71em")
      .style("text-anchor", "middle")
      .text("平均年収（千円）")
	//マッププロジェクション定義、マップ描画
	
	//ツールチップ
	var idTooltip = idChart.append("div")
		.attr("id","tooltip")
		.classed("hidden", true);
	idTooltip.append("div").attr("class", "arrow");	//吹き出し用Arrow
		
	idTooltip.append("p").attr("id","line1");	//tooltip内の表示用にpタグをつくっておく
	idTooltip.append("p").attr("id","line2");
	idTooltip.append("p").attr("id","line3");
	idTooltip.append("p").attr("id","line4");
	
	//データ描画
	var plots = svgChart
					.selectAll("circle")
				   .data(data1)
				   .enter()
				   .append("circle")
				   .attr("cx",function(d){
						return xScale(d.workers);	//横軸　従業員数（人）
					})
					.attr("cy",function(d){
						return yScale(d.salary);	//縦軸　平均年収（千円）
					})
					.attr("r", function(d){
						return d.age*0.3;	//円の半径は平均年齢(age)に比例
					})
					.style("fill",function(d){
						return color[category(d.id)];	//カテゴリ（id）別に色分け
					})
					.style("stroke",function(d){
						return color[category(d.id)];	//カテゴリ（id）別に色分け
					})
					.on("mouseover", function(d){
						d3.select(this)
							.style("stroke-width","4px");		//線を太く
						d3.select("#line1").text(d.name);	//情報を表示
						d3.select("#line2").text("従業員数: "+d.workers+"人");		
						d3.select("#line3").text("平均年齢: "+d.age+"歳");	
						d3.select("#line4").text("平均年収: "+d.salary+"千円");
						
						var xp = parseFloat(d3.select(this).attr("cx")) + margin.left -23;
						var yp = parseFloat(d3.select(this).attr("cy")) + margin.top - 15;
						var bgcolor = color[parseInt(category(d.id))];
						//ツールチップの表示
						d3.select("#tooltip")	
							.style("left",function(d){
								return  xp + "px";
							})
							.style("top",function(d){
								return yp + "px";
							})
							.style("background-color", bgcolor)		//背景の色を変える
							.classed("hidden",false);
						d3.select("#tooltip").select(".arrow")
							.style("border-top", "12px solid "+bgcolor);		//吹き出し用Arrowの色を変える
					})
					.on("mouseout", function(){
						d3.select(this)
							.style("stroke-width","1px");		//線の太さを戻す
						d3.select("#tooltip").classed("hidden",true);	//ツールチップを消去
					})
					.on("click", function(d){
						var win = window.open(d.url, '_blank');
  						win.focus();
					});
					
	//凡例とフィルタリングUI
	var drawFlags = [true,true,true,true,true,true];	//描画フラグ		
	var legend = svgChart.selectAll(".legend")
      .data(category.domain())
      .enter().append("g")
      .attr("class", "legend")
      .attr("transform", function(d, i) { return "translate(0," + (i * 24 + height*0.6) + ")"; })
	  .on("click", function(d,i){
		  drawFlags[i] = !drawFlags[i];	//該当するフラグを反転
		  //フィルタリング＆再描画
		  if(drawFlags[i]){
			  d3.select(this).select("circle").style("fill-opacity", 1.0);
		  }else{
			  d3.select(this).select("circle").style("fill-opacity", 0.0);
		  }
		  plots
		  	  .style("display", function(d){
			  //フィルタリング
			  		if(drawFlags[category(d.id)]){
				  		return "inherit";
			  		}else{
				  		return "none";
			  		}
		  	  });
	  })
	  .on("mouseover", function(){
		  d3.select(this).select("circle").style("stroke-width","4px")		//線を太く
	  })
	  .on("mouseout", function(){
		  d3.select(this).select("circle").style("stroke-width","1px")		//線を細く
	  });
	  
	//凡例マーカー
	legend.append("circle")
      .attr("cx", width - 10)
      .attr("r", 9)
      .style("fill",function(d,i){
				return color[i]; 
	  })
	  .style("stroke", function(d,i){
				return color[i]
	  })
	  ;
	  //凡例テキスト
	 var caption =["ネットベンチャー","ソーシャルメディア","モバイル＆ゲーム","SEO/SEM","オンラインメディア","アフィリエイト"];
	 legend.append("text")
      .attr("x", width - 32)
      .attr("y", 0)
      .attr("dy", ".35em")
      .style("text-anchor", "end")
      .text(function(d,i) { 
	  		return caption[i]; 
		});
}

//