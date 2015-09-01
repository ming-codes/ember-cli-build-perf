import Ember from 'ember';

export default Ember.Controller.extend({
  model: Ember.computed({
    set(name, input) {
      var nodes = [], links = [];

      input.forEach(({ id, description, subtrees, selfTime, totalTime }) => {
        selfTime /= 1000000;
        totalTime /= 1000000;

        nodes.push({ id, name: description, selfTime, totalTime });

        subtrees.forEach(target => {
          // build flows from subtree to parent tree
          links.push({ source: target, target: id, value: selfTime });
        });
      });

      return { nodes, links };
    }
  })
});
