chrome.storage.sync.get(["commandIndex"], function (results) {
	var currentCommandIndex = results.commandIndex;
	var commandContainer = $("#commandIndex");

	function updateCommandIndex() {
		chrome.storage.sync.set({
			commandIndex: currentCommandIndex
		}); // async
	}

	function capitalizeFirstLetter(string) {
		return string.charAt(0).toUpperCase() + string.slice(1);
	}

	$.each(currentCommandIndex, function (command, link) {
		var newCommandElement = $($.parseHTML("<li class='collection-item avatar'></li>"));
		var websiteImage = $("<img />", {
			src: "https://s2.googleusercontent.com/s2/favicons?domain_url=" + (new URL(link)).origin,
			class: "circle"
		});
		newCommandElement.append(websiteImage);
		var websiteInfo = $($.parseHTML("<span class='title'>" + capitalizeFirstLetter(command) + "</span><p>" + link + "</p>"));
		newCommandElement.append(websiteInfo);
		var taskBar = $($.parseHTML("<div class='secondary-content'></div>"));
		var editButton = $($.parseHTML("<a href='#'><li class='large material-icons'>edit</li></a>"));
		editButton.on("click", function () {
			var editModal = $($.parseHTML("<div class='modal'></div>"));
			var modalInstance = M.Modal.getInstance(editModal[0]);
			var modalContent = $($.parseHTML("<div class='modal-content'></div>"));
			var editBox = $($.parseHTML("<div class='input-field col s12'></div>"));
			var editTextBox = $($.parseHTML("<input type='text'>" + link + "</input>"));
			editTextBox.keyup(function (event) {
				if (event.keyCode === 13) { // 'enter' key
					link = editTextBox.val();
					currentCommandIndex[command] = link;
					updateCommandIndex(); // important
					modalInstance.close();
				}
			});
			editBox.append(editTextBox);
			modalContent.append(editBox);
			editModal.append(modalContent);
			modalInstance.open();
			editTextBox[0].focus(); // set focus to the text box
		});
		var deleteButton = $($.parseHTML("<a href='#'><li class='large material-icons'>delete</li></a>"));
		deleteButton.on("click", function () {
			newCommandElement.remove();
			delete currentCommandIndex[command];
			updateCommandIndex(); // important
		});
		taskBar.append(editButton);
		taskBar.append(deleteButton);
		newCommandElement.append(taskBar);
		commandContainer.append(newCommandElement);
	});
});