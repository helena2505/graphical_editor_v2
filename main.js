function main() {
    // Checks if browser is supported
    if (!mxClient.isBrowserSupported())  {
        // Displays an error message if the browser is
        // not supported.
        mxUtils.error('Browser is not supported!', 200, false);
    } else {
        // Defines an icon for creating new connections in the connection handler.
        // This will automatically disable the highlighting of the source vertex.
        //mxConnectionHandler.prototype.connectImage = new mxImage('mxgraph-4.0.6/javascript/src/images/connector.gif', 16, 16);
        mxConstraintHandler.prototype.pointImage = new mxImage('mxgraph-4.0.6/javascript/src/images/dot.gif', 10, 10);
        mxVertexHandler.prototype.rotationEnabled = true;

        let tbContainer = document.getElementById('palette-zone');

        // Creates new toolbar without event processing
        let toolbar = new mxToolbar(tbContainer);
        toolbar.enabled = false;

        let container = document.getElementById('myDiagramDiv');

        // Workaround for Internet Explorer ignoring certain styles
        if (mxClient.IS_QUIRKS)  {
            document.body.style.overflow = 'hidden';
            new mxDivResizer(tbContainer);
            new mxDivResizer(container);
        }

        // Creates the model and the graph inside the container
        // using the fastest rendering available on the browser
        let model = new mxGraphModel();
        let graph = new mxGraph(container, model);

        // Enables new connections in the graph
        graph.setConnectable(true);
        graph.setMultigraph(true);

        // Stops editing on enter or escape keypress
        let keyHandler = new mxKeyHandler(graph);
        let rubberband = new mxRubberband(graph);

        var parent = graph.getDefaultParent();

        // Ports are equal for all shapes...
        var ports = new Array();

        // NOTE: Constraint is used later for orthogonal edge routing (currently ignored)
        ports['w'] = {x: 0, y: 0.5, perimeter: true, constraint: 'west'};
        ports['e'] = {x: 1, y: 0.5, perimeter: true, constraint: 'east'};
        ports['n'] = {x: 0.5, y: 0, perimeter: true, constraint: 'north'};
        ports['s'] = {x: 0.5, y: 1, perimeter: true, constraint: 'south'};
        ports['nw'] = {x: 0, y: 0, perimeter: true, constraint: 'north west'};
        ports['ne'] = {x: 1, y: 0, perimeter: true, constraint: 'north east'};
        ports['sw'] = {x: 0, y: 1, perimeter: true, constraint: 'south west'};
        ports['se'] = {x: 1, y: 1, perimeter: true, constraint: 'south east'};

        // ... except for triangles
        var ports2 = new Array();

        // NOTE: Constraint is used later for orthogonal edge routing (currently ignored)
        ports2['in1'] = {x: 0, y: 0, perimeter: true, constraint: 'west'};
        ports2['in2'] = {x: 0, y: 0.25, perimeter: true, constraint: 'west'};
        ports2['in3'] = {x: 0, y: 0.5, perimeter: true, constraint: 'west'};
        ports2['in4'] = {x: 0, y: 0.75, perimeter: true, constraint: 'west'};
        ports2['in5'] = {x: 0, y: 1, perimeter: true, constraint: 'west'};

        ports2['out1'] = {x: 0.5, y: 0, perimeter: true, constraint: 'north east'};
        ports2['out2'] = {x: 1, y: 0.5, perimeter: true, constraint: 'east'};
        ports2['out3'] = {x: 0.5, y: 1, perimeter: true, constraint: 'south east'};

        // Extends shapes classes to return their ports
        mxShape.prototype.getPorts = function()
        {
            return ports;
        };

        mxTriangle.prototype.getPorts = function()
        {
            return ports2;
        };

        // Disables floating connections (only connections via ports allowed)
        graph.connectionHandler.isConnectableCell = function(cell)
        {
            return false;
        };
        mxEdgeHandler.prototype.isConnectableCell = function(cell)
        {
            return graph.connectionHandler.isConnectableCell(cell);
        };

        // Disables existing port functionality
        graph.view.getTerminalPort = function(state, terminal, source)
        {
            return terminal;
        };

        // Returns all possible ports for a given terminal
        graph.getAllConnectionConstraints = function(terminal, source)
        {
            if (terminal != null && terminal.shape != null &&
                terminal.shape.stencil != null)
            {
                // for stencils with existing constraints...
                if (terminal.shape.stencil != null)
                {
                    return terminal.shape.stencil.constraints;
                }
            }
            else if (terminal != null && this.model.isVertex(terminal.cell))
            {
                if (terminal.shape != null)
                {
                    var ports = terminal.shape.getPorts();
                    var cstrs = new Array();

                    for (var id in ports)
                    {
                        var port = ports[id];

                        var cstr = new mxConnectionConstraint(new mxPoint(port.x, port.y), port.perimeter);
                        cstr.id = id;
                        cstrs.push(cstr);
                    }

                    return cstrs;
                }
            }

            return null;
        };

        // Sets the port for the given connection
        graph.setConnectionConstraint = function(edge, terminal, source, constraint)
        {
            if (constraint != null)
            {
                var key = (source) ? mxConstants.STYLE_SOURCE_PORT : mxConstants.STYLE_TARGET_PORT;

                if (constraint == null || constraint.id == null)
                {
                    this.setCellStyles(key, null, [edge]);
                }
                else if (constraint.id != null)
                {
                    this.setCellStyles(key, constraint.id, [edge]);
                }
            }
        };

        // Returns the port for the given connection
        graph.getConnectionConstraint = function(edge, terminal, source)
        {
            var key = (source) ? mxConstants.STYLE_SOURCE_PORT : mxConstants.STYLE_TARGET_PORT;
            var id = edge.style[key];

            if (id != null)
            {
                var c =  new mxConnectionConstraint(null, null);
                c.id = id;

                return c;
            }

            return null;
        };

        // Returns the actual point for a port by redirecting the constraint to the port
        graphGetConnectionPoint = graph.getConnectionPoint;
        graph.getConnectionPoint = function(vertex, constraint)
        {
            if (constraint.id != null && vertex != null && vertex.shape != null)
            {
                var port = vertex.shape.getPorts()[constraint.id];

                if (port != null)
                {
                    constraint = new mxConnectionConstraint(new mxPoint(port.x, port.y), port.perimeter);
                }
            }

            return graphGetConnectionPoint.apply(this, arguments);
        };

        // Setting the default style of vertexes
        let style = graph.getStylesheet().getDefaultVertexStyle();
        style[mxConstants.STYLE_SHAPE] = 'label';
        style[mxConstants.STYLE_FILLCOLOR] = 'white';
        style[mxConstants.STYLE_STROKECOLOR] = 'black';
        style[mxConstants.STYLE_STROKEWIDTH] = 1;
        style[mxConstants.STYLE_FONTCOLOR] = 'black';
        style[mxConstants.STYLE_FONTFAMILY] = 'arial';
        style[mxConstants.STYLE_FONTSIZE] = 20;

        // Setting the default style of edges
        let style1 = graph.getStylesheet().getDefaultEdgeStyle();
        style1[mxConstants.STYLE_FILLCOLOR] = 'black';
        style1[mxConstants.STYLE_STROKECOLOR] = 'black';
        style1[mxConstants.STYLE_STROKEWIDTH] = 5;

        // Enabling alignment relating to another primitives
        mxGraphHandler.prototype.guidesEnabled = true;

        let addVertex = function(icon, w, h, style)  {
            let vertex = new mxCell(null, new mxGeometry(0, 0, w, h), style);
            vertex.setVertex(true);

            let img = addToolbarItem(graph, toolbar, vertex, icon);
            img.enabled = true;

            graph.getSelectionModel().addListener(mxEvent.CHANGE, function() {
                let tmp = graph.isSelectionEmpty();
                mxUtils.setOpacity(img, (tmp) ? 100 : 20);
                img.enabled = tmp;
            });
        };

        let addEdge = function(icon, w, h, style)  {
            let edge = new mxCell(null, new mxGeometry(0, 0, w, h), style);
            edge.setEdge(true);
            edge.setStyle(style);

            let img1 = addToolbarItem(graph, toolbar, edge, icon);
            img1.enabled = true;

            graph.getSelectionModel().addListener(mxEvent.CHANGE, function() {
                let tmp = graph.isSelectionEmpty();
                mxUtils.setOpacity(img1, (tmp) ? 100 : 20);
                img1.enabled = tmp;
            });
        };

        addVertex('pictures1/rect.svg', 80, 50, '');
        addVertex('pictures1/text.svg', 80, 50, 'text;html=1;strokeColor=none;fillColor=none;align=center;verticalAlign=middle;whiteSpace=wrap;rounded=0;');
        addVertex('pictures1/square.svg', 50, 50, 'whiteSpace=wrap;html=1;aspect=fixed;');
        addVertex('pictures1/circ.svg', 50, 50, 'shape=ellipse;whiteSpace=wrap;html=1;aspect=fixed;perimeter=ellipsePerimeter');
        addVertex('pictures1/round_rect.svg', 80, 50, 'rounded=1;whiteSpace=wrap;html=1;');
        addVertex('pictures1/ellipse.svg', 80, 50, 'shape=ellipse;perimeter=ellipsePerimeter');
        addVertex('pictures1/parell.svg', 80, 50, 'shape=hexagon;perimeter=hexagonPerimeter2;whiteSpace=wrap;html=1;');
        addVertex('pictures1/diamond.svg', 80, 50, 'shape=rhombus;perimeter=rhombusPerimeter');
        addVertex('pictures1/triangle.svg', 80, 50, 'shape=triangle;perimeter=trianglePerimeter');

        addEdge('pictures1/line.svg', 80, 50, 'curved=1;endArrow=none;html=1;strokeWidth=2');
        addEdge('pictures1/right_arrow.svg', 80, 50, 'curved=1;endArrow=classic;html=1;');

        // Setting undo and redo functions
        let undoManager = new mxUndoManager();
        let listener = function(sender, event) {
            undoManager.undoableEditHappened(event.getProperty('edit'));
        };
        graph.getModel().addListener(mxEvent.UNDO, listener);
        graph.getView().addListener(mxEvent.UNDO, listener);
        tbContainer.appendChild(mxUtils.button('Undo', function() {
            undoManager.undo();
        }));
        tbContainer.appendChild(mxUtils.button('Redo', function() {
            undoManager.redo();
        }));

        window.onkeyup = function(event) {
            if (event.keyCode === 90) { // Checking that pressing ctrl+z has happened indeed
                undoManager.undo(); // Undo an operation
            }
            event = event || window.event;
            let key = event.which || event.keyCode; // keyCode detection
            let ctrl = event.ctrlKey ? event.ctrlKey : ((key === 17) ? true : false); // ctrl detection

            if (key == 86 && ctrl) {
                mxClipboard.paste(graph);
            } else if (key == 67 && ctrl) {
                mxClipboard.copy(graph);
            }
        }

        // Setting the functions for deleting elements
        keyHandler.bindKey(46, function(evt) {
            if (graph.isEnabled()) {
                graph.removeCells();
            }
        });
        tbContainer.appendChild(mxUtils.button('Delete node', function(event) {
            if (graph.isEnabled()) {
                graph.removeCells();
            }
        }));

        mxClipboard.copy = function(graph, cells) {
            cells = cells || graph.getSelectionCells();
            let result = graph.getExportableCells(cells);

            mxClipboard.parents = new Object();

            for (var i = 0; i < result.length; i++)  {
                mxClipboard.parents[i] = graph.model.getParent(cells[i]);
            }

            mxClipboard.insertCount = 1;
            mxClipboard.setCells(graph.cloneCells(result));

            return result;
        };

        mxClipboard.paste = function(graph) {
            if (!mxClipboard.isEmpty()) {
                var cells = graph.getImportableCells(mxClipboard.getCells());
                var delta = mxClipboard.insertCount * mxClipboard.STEPSIZE;
                var parent = graph.getDefaultParent();

                graph.model.beginUpdate();
                try {
                    for (var i = 0; i < cells.length; i++) {
                        var tmp = (mxClipboard.parents != null && graph.model.contains(mxClipboard.parents[i])) ?
                            mxClipboard.parents[i] : parent;
                        cells[i] = graph.importCells([cells[i]], delta, delta, tmp)[0];
                    }
                } finally {
                    graph.model.endUpdate();
                }

                // Increments the counter and selects the inserted cells
                mxClipboard.insertCount++;
                graph.setSelectionCells(cells);
            }
        };
    }
}

function addToolbarItem(graph, toolbar, prototype, image)  {
    // Function that is executed when the image is dropped on
    // the graph. The cell argument points to the cell under
    // the mousepointer if there is one.
    let funct = function(graph, evt, cell, x, y) {
        graph.stopEditing(false);

        let curCell = graph.getModel().cloneCell(prototype);
        if(prototype.isVertex()) {
            curCell.geometry.x = x;
            curCell.geometry.y = y;
        }
        else {
            curCell.geometry.setTerminalPoint(new mxPoint(x, y), true);
            curCell.geometry.setTerminalPoint(new mxPoint(x+80, y), false);
        }

        graph.addCell(curCell);
        graph.setSelectionCell(curCell);
    }

    // Creates the image which is used as the drag icon (preview)
    let img = toolbar.addMode(null, image, function(evt, cell)  {
        let pt = this.graph.getPointForEvent(evt);
        funct(graph, evt, cell, pt.x, pt.y);
    });

    // Disables dragging if element is disabled. This is a workaround
    // for wrong event order in IE. Following is a dummy listener that
    // is invoked as the last listener in IE.
    mxEvent.addListener(img, 'mousedown', function(evt) {
        // do nothing
    });

    // This listener is always called first before any other listener
    // in all browsers.
    mxEvent.addListener(img, 'mousedown', function(evt) {
        if (img.enabled == false) {
            mxEvent.consume(evt);
        }
    });

    // Creating the element which is going to be showed while dragging
    let dragElt = document.createElement('div');
    dragElt.style.border = 'dashed black 1px';
    dragElt.style.width = '80px';
    dragElt.style.height = '50px';

    mxUtils.makeDraggable(img, graph, funct, dragElt, null, null, graph.autoscroll, true);

    return img;
}
