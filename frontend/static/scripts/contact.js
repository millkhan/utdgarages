(function() {
    const copyButton = document.getElementById("copy-button");
    const copyCheck = document.getElementById("copy-check");

    function toggleCheck(element) {
        element.style.animation = "";
        element.offsetHeight;
        element.style.animation = "check-animation 2s";
    }

    const email = "millkhan.dev@gmail.com";
    copyButton.onclick = async (e) => {
        await navigator.clipboard.writeText(email);
        toggleCheck(copyCheck);
    };
})();