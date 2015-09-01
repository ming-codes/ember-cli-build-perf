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

  nodeColorScale: Ember.computed('data.nodes', function () {
    return d3.scale.linear()
      .domain([ 0, d3.max(this.get('data.nodes'), accessor('selfTime')) ])
      .range([ 'blue', 'red' ]);
  }),

  forceLayout: Ember.computed('data.nodes', 'data.links', 'contentWidth', 'contentHeight', function () {
    var nodes = this.get('data.nodes');
    var links = this.get('data.links');
    var width = this.get('contentWidth');
    var height = this.get('contentHeight');

    var force = d3.layout.force()
      //.gravity(0)
      //.charge(-5)
      //.friction(0.9)
      .nodes(nodes)
      .links(links)
      .size([ width, height ]);

    force.start();
    while (force.alpha() > 0.005) { force.tick(); }
    force.stop();

    return force;
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
      var color = this.get('nodeColorScale');

      selection
          .attr('r', 3)
          .attr("cx", ({ x }) => x)
          .attr("cy", ({ y }) => y)
          .style('fill', flow(accessor('selfTime'), color));

      selection
        .select('.tooltip')
          .text(({ name, selfTime }) => `${name}: ${selfTime}`)
    }
  }),

  links: join('data.links', 'line.link', {
    enter(selection) {
      selection
        .append('line')
          .classed('link', true)
        .append('title')
          .classed('tooltip', true)
    },
    update(selection) {
      selection
        .attr('x1', accessor('source.x'))
        .attr('y1', accessor('source.y'))
        .attr('x2', accessor('target.x'))
        .attr('y2', accessor('target.y'))

      selection
        .select('.tooltip')
          //.text(({ source, target }) => {
          //  source = nodes[source].name;
          //  target = nodes[target].name;

          //  return `${source} => ${target}`;
          //});
    }
  }),

  call(sel) {
    var force = this.get('forceLayout');

    var update = sel.attr('transform', 'translate(0 0)')
      .selectAll('.layer').data([ 'links', 'nodes' ]);

    update.enter()
      .append('g')
        .attr('class', type => `${type} layer`);

    update
      .filter(type => type === 'nodes')
        .call(sel => this.nodes(sel));

    update
      .filter(type => type === 'links')
        .call(sel => this.links(sel));
  }
});
