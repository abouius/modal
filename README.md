# Responsive Modal

### Usage

Create a new modal by inserting the following markup into your document

``` html
<div class="modal" data-modal-id="my-modal"></div>
```

To display the modal you can either trigger a click on an element that has a `data-modal-target` attribute...
``` html
<a href="#" data-modal-target="my-modal">Open My Modal</a>
```

Or you can display it manually  with Javascript
``` javascript
// via jQuery element object
$('[data-modal-id=my-modal]').modal('open');
// via element modal class instance
$('[data-modal-id=my-modal]').data('modal').open();
// via static plugin method
$.modal.open('my-modal');
```

To close the modal you can either trigger a click on an element with a `data-modal-action="close"` element that is contained within the modal container
``` html
<div class="modal" data-modal-id="my-modal">
  <a href="#" data-modal-action="close">Close</a>
</div>
```

Or you can close it manually with Javascript
``` javascript
// via jQuery element object
$('[data-modal-id=my-modal]').modal('close');
// via element modal class instance
$('[data-modal-id=my-modal]').data('modal').close();
// via static plugin method
$.modal.close('my-modal');
```

### Modal Events

The modal plugin exposes various events for hooking into its functionality.

Event Name | Description
--- | ---
initializeModal | Fired the first time a modal is opened, before the `beforeOpenModal` event.
beforeOpenModal | Fired immediately after the `open` method is called.
afterOpenModal | Fired after the modal has been made visible.
beforeCloseModal | Fired immediately after the `close` method is called.
afterCloseModal | Fired after the modal has been completely hidden.

### Event Objects
Some of the modal event objects may contain useful references to related elements/modals.

##### event.relatedTarget
If a modal is opened via an element with a `data-modal-target` attribute, that element's DOM node is accessible in the event object for the `beforeOpenModal` and `afterOpenModal` events via the `relatedTarget` key.
``` javascript
$('#my-modal').on('beforeOpenModal', function (event) {
  var $link = $(event.relatedTarget);
});
```

##### event.relatedModal
If a modal is instructed to be opened while a different modal is currently open, the `relatedModal` key of the event object will contain a reference to the class instance of the other modal being opened/closed.  For example, the `beforeOpenModal` and `afterOpenModal` events will reference the modal that is being closed, and the `beforeCloseModal` and `afterCloseModal` events will reference the modal that is being opened.
``` javascript
$('#my-modal').on('beforeOpenModal', function (event) {
  // modal class instance
  var modal = event.relatedModal;
  // jQuery object for element node
  var $modal = modal.$el;
});
```
