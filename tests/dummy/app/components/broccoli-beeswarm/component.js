import Ember from 'ember';
import d3 from 'd3';
import GraphicSupport from 'ember-cli-d3/mixins/d3-support';

import { box } from 'ember-cli-d3/utils/css';
import { join, accessor } from 'ember-cli-d3/utils/d3';
import { identity, flow } from 'ember-cli-d3/utils/lodash';

export default Ember.Component.extend(GraphicSupport, {
  marginDefault: box(20),
  margin: box.asComputed('marginDefault'),

  contentWidth: Ember.computed('width', function () {
    return this.get('width') - this.get('margin.left') - this.get('margin.right');
  }),

  contentHeight: Ember.computed('height', function () {
    return this.get('height') - this.get('margin.top') - this.get('margin.bottom');
  }),

  bucketScale: Ember.computed('data.nodes', 'contentWidth', function () {
    var width = this.get('width');
    var nodes = this.get('data.nodes');

    return d3.scale.linear()
      .domain([ 0, d3.max(nodes, accessor('selfTime')) ])
      .range([ 0, width ]);
  }),

  graphLayout: Ember.computed('data.nodes', 'contentWidth', 'contentHeight', function () {
    var nodes = this.get('data.nodes');
    var width = this.get('contentWidth');
    var height = this.get('contentHeight');

    return d3.layout.force()
      .gravity(0)
      .charge(0)
      .friction(0.9)
      .nodes(nodes)
      .size([ width, height ]);
  }),

  nodes: join('data.nodes', 'circle.node', {
    enter(selection) {
      selection
        .append('circle')
          .classed('node', true)
        .append('title')
          .classed('tooltip', true)
    },
    update(selection) {
      //var angle = this.get('angleScale');
      //var radius = this.get('radius');
      //var color = this.get('nodeColorScale');

      selection
          .attr('r', 2)
          //.attr('cx', flow(identity(1), angle, Math.cos, cos => radius * cos))
          //.attr('cy', flow(identity(1), angle, Math.sin, sin => radius * sin))
          //.style('fill', flow(accessor('selfTime'), color))

      selection
        .select('.tooltip')
          .text(({ name, selfTime }) => `${name}: ${selfTime}`)
    }
  }),

  call(sel) {
    var cx = this.get('width') / 2;
    var cy = this.get('height') / 2;

    var force = this.get('graphLayout');
    var nodes = this.get('data.nodes');
    var foci = [ {
      x: 150, y: 150
    }, {
      x: 350, y: 250
    }, {
      x: 700, y: 400
    } ];

    var update = sel.attr('transform', `translate(${cx} ${cy})`)
      .selectAll('.layer').data([ 'links', 'nodes' ]);

    update.enter()
      .append('g')
        .attr('class', type => `${type} layer`);

    update
      .filter(type => type === 'nodes')
        .call(sel => this.nodes(sel));

    //update
    //  .filter(type => type === 'links')
    //    .call(sel => this.links(sel));

    //var node = svg.selectAll("circle");

    force.on('tick', tick);
    force.start();

    function tick(e) {
      var k = .1 * e.alpha;

      // Push nodes toward their designated focus.
      nodes.forEach(function(o, i) {
        o.y += (foci[o.id].y - o.y) * k;
        o.x += (foci[o.id].x - o.x) * k;
      });

      //node
      //    .attr("cx", function(d) { return d.x; })
      //    .attr("cy", function(d) { return d.y; });
    }

    //setInterval(function(){
    //  nodes.push({id: ~~(Math.random() * foci.length)});
    //  force.start();

    //  node = node.data(nodes);

    //  node.enter().append("circle")
    //      .attr("class", "node")
    //      .attr("cx", function(d) { return d.x; })
    //      .attr("cy", function(d) { return d.y; })
    //      .attr("r", 8)
    //      .style("fill", function(d) { return fill(d.id); })
    //      .style("stroke", function(d) { return d3.rgb(fill(d.id)).darker(2); })
    //      .call(force.drag);
    //}, 500);
  }
});
