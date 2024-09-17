function Backend() {
  const apiKey = "e99df8c3bb4382bef59a61dbd7efcbac";
  const apiUrl = "/api/v1/establishments/";

  const requestOptions = {
    method: "GET",
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  };

  fetch(apiUrl, requestOptions)
    .then((response) => {
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Data not found");
        } else if (response.status === 500) {
          throw new Error("Server error");
        } else {
          throw new Error("Network response was not ok");
        }
      }
      return response.json();
    })
    .then((result) => {
      console.log(result);

      const arr = [];

      result.data.forEach((element) => {
        // document.write(JSON.stringify(element.attributes.postal_addresses));
        arr.push(JSON.stringify(element.attributes.postal_addresses));
      });

      // Create a blob from the array of postal addresses
      const blob = new Blob([arr.join("\n")], { type: "text/plain" });

      // Create a temporary link to trigger the download
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = "output.txt"; // Set the file name for the download
      document.body.appendChild(link); // Append the link to the document body
      link.click(); // Programmatically click the link to trigger the download
      document.body.removeChild(link); // Remove the link from the document after the download is triggered
    })
    .catch((error) => {
      console.error("Error:", error);
    });
}

export default Backend;
