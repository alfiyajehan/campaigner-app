    (function(){
            emailjs.init({
                publicKey: "6QkAirEgCV-7ywMiO",
            });
        })();

    var mainSection = document.querySelector(".mainSection");
    var uploadSection = document.querySelector("#uploadSection");
    document.querySelector('.createCampaign').addEventListener('click', () => {
        mainSection.style.display = 'none';
        uploadSection.style.display = 'block';
    });

    document.querySelector('.createCampaign').addEventListener('click', () => {
    Toastify({
        text: `<strong>✅ Campaign successfully created!</strong>`,
        duration: 3000,
        gravity: "top",
        position: "left",
        escapeMarkup: false,
        close: false,
        style: {
        background: "white",
        color: "black",
        border: "1px solid rgba(153, 153, 142, 0.93)",
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
        borderRadius: "0.9em",
        margin:"5px",
        padding: "0.6em",
        width: "20em",
        fontFamily: "Inter, sans-serif",
        fontWeight: "500"
        }
    }).showToast();
    });

    var errorM = document.querySelector("#errorM");
    var fileInput = document.querySelector('#fileUpload');

    fileInput.addEventListener("change", () => {
        var file = fileInput.files[0];
        if(file.size === 0){
            errorM.textContent = "File is empty!";
            errorM.style.display = "block";
            return;
        }
        
        const fileType = file.name.split('.').pop().toLowerCase();
        if (fileType !== "csv" && fileType !== "xlsx" && fileType !== "xls") {
            errorM.textContent = "Please upload a CSV or Excel file.";
            errorM.style.display = "block";
            return;
        }

        const reader = new FileReader();
        reader.onload = function(e) {
            if(fileType === "xlsx" || fileType === "xls") {
                const data = e.target.result;
                const workbook = XLSX.read(data, { type: 'binary' });
                const sheet = workbook.Sheets[workbook.SheetNames[0]];
                const csv = XLSX.utils.sheet_to_csv(sheet);
                displayCSVData(csv);
            } else if(fileType === "csv") {
                const csvData = e.target.result;
                displayCSVData(csvData);
            }
        };

        if(fileType === "csv") {
            reader.readAsText(file);
        } else {
            reader.readAsBinaryString(file);
        }
    });

    fetch('data.csv')
        .then(response => response.text())
        .then(csv => {
            parseCSVToHTMLTable(csv);
        })
        .catch(error => {
            console.error('Error loading CSV:', error);
        });

    function displayCSVData(csv) {
        const rows = csv.trim().split("\n");
        const headers = rows[0].split(",").map(header => header.replace(/['"]+/g, '').trim());
        
        // Parse CSV data into entries
        window.parsedEntries = rows.slice(1).map(row => {
            const values = row.split(",").map(cell => cell.replace(/['"]+/g, '').trim());
            return headers.reduce((obj, header, index) => {
                obj[header.toLowerCase()] = values[index];
                return obj;
            }, {});
        });
        
        let html = "<table class='border-collapse w-full bg-white shadow-md rounded-lg'><thead class='bg-gray-100'><tr>";
        headers.forEach(header => {
            html += `<th class='px-4 py-2 border text-left'>${header}</th>`;
        });
        html += "</tr></thead><tbody>";
        rows.slice(1).forEach(row => {
            const cells = row.split(",").map(cell => cell.replace(/['"]+/g, '').trim());
            html += "<tr class='hover:bg-gray-50'>";
            cells.forEach(cell => {
                html += `<td class='px-4 py-2 border'>${cell}</td>`;
            });
            html += "</tr>";
        });
        html += "</tbody></table>";

        const tableContainer = document.getElementById('csvTableContainer');
        
        const tableHTML = `
            <div class="w-full flex justify-end p-4">
                <button id="sendEmailBtn" class="px-6 py-2 rounded-full bg-yellow-400 text-black hover:bg-yellow-500 transition-all ease-linear cursor-pointer">
                    Send Email
                </button>
            </div>
            ${html}
        `;
        
        tableContainer.innerHTML = tableHTML;
        tableContainer.classList.remove('hidden');
        uploadSection.style.display = "none";

        // Add event listener to the new button
        document.getElementById('sendEmailBtn').onclick = async function() {
            const button = this;
            
            try {
                if (!window.parsedEntries?.length) {
                    throw new Error('No email data available');
                }

                button.disabled = true;
                button.textContent = 'Sending...';

                for (let i = 0; i < window.parsedEntries.length; i++) {
                    const entry = window.parsedEntries[i];
                    
                    try {
                        console.log("Entry", entry)
                        await emailjs.send("service_efv054l", "template_prehrlc", {
                            to_name: entry.name,
                            email: entry.email,
                            message: "Here is your email message!"
                        });

                        Toastify({
                            text: `✅ Email sent to ${entry.name}`,
                            duration: 3000,
                            style: {
                                background: "green",
                                color: "white"
                            }
                        }).showToast();

                        await new Promise(resolve => setTimeout(resolve, 1000));

                    } catch (error) {
                        console.error(`Failed to send email to ${entry.name}:`, error);
                        Toastify({
                            text: `❌ Failed to send email to ${entry.name}`,
                            duration: 3000,
                            style: {
                                background: "red",
                                color: "white"
                            }
                        }).showToast();
                    }
                }
            } catch (error) {
                console.error('Email sending failed:', error);
                alert(error.message);
            } finally {

                button.disabled = false;
                button.textContent = 'Send Email';
            }
        };
    }



