# Visualizations

Visualizations to demonstrate how to use Nebula to implement coordination between visualizations.

In each visualization, input from external sources and output derived from user interactions are bound to "reactive properties" to trigger update in this and other visualizations.

## Reactive Properties

Each reactive property has a callback which is triggered on external input in order to update the visualization. In addition, some reactive property listens to internal update resulted from direct user interaction and propagate the changes to a list of subscribers which are other reactive properties and trigger update in other visualizations. For detail, see `src/reactive-prop.js`.

According to the grammar, a reactive property may be referenced in a coordination construct in two ways: 1) as a data property of a visualization, like `<visualizationId>.<property>` at the "what" level, 2) through a corresponding interaction method and target, like `<method> <target> in <visualizationId>` at the "how" level.

For available reactive properties for each visualization type and related method, target, callback, and internal listener, see respective README file.

> Note: some old code in the repo refers to "method" as "action", and "target" as "option".
