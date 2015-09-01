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

  radius: Ember.computed('contentWidth', 'contentHeight', function () {
    return Math.min(this.get('contentWidth'), this.get('contentHeight')) / 2;
  }),

  nodeColorScale: Ember.computed('data.nodes', function () {
    return d3.scale.linear()
      .domain([ 0, d3.max(this.get('data.nodes'), accessor('selfTime')) ])
      .range([ 'blue', 'red' ]);
  }),

  angleScale: Ember.computed('data.nodes', function () {
    var nodes = this.get('data.nodes');

    return d3.scale.linear()
      .domain([ 0, nodes.length ])
      .range([ 0, 2 * Math.PI ])
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
      var angle = this.get('angleScale');
      var radius = this.get('radius');
      var color = this.get('nodeColorScale');

      selection
          .attr('r', 2)
          .attr('cx', flow(identity(1), angle, Math.cos, cos => radius * cos))
          .attr('cy', flow(identity(1), angle, Math.sin, sin => radius * sin))
          .style('fill', flow(accessor('selfTime'), color))

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
      var angle = this.get('angleScale');
      var radius = this.get('radius');
      var nodes = this.get('data.nodes');

      selection
        .attr('x1', flow(accessor('source'), angle, Math.cos, cos => radius * cos))
        .attr('y1', flow(accessor('source'), angle, Math.sin, sin => radius * sin))
        .attr('x2', flow(accessor('target'), angle, Math.cos, cos => radius * cos))
        .attr('y2', flow(accessor('target'), angle, Math.sin, sin => radius * sin))

      selection
        .select('.tooltip')
          .text(({ source, target }) => {
            source = nodes[source].name;
            target = nodes[target].name;

            return `${source} => ${target}`;
          });
    }
  }),

  call(sel) {
    var cx = this.get('width') / 2;
    var cy = this.get('height') / 2;

    var update = sel.attr('transform', `translate(${cx} ${cy})`)
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
