const fetch = require('node-fetch');
const TelegramBot = require('node-telegram-bot-api');
const _ = require('lodash');
// ... (rest of the code remains the same)

const TELEGRAM_BOT_TOKEN = 'Your Bot Key';
const API_KEY = 'Your api key';
const API_ENDPOINT = 'https://api.crackeddevs.com/api/get-jobs';

const bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: true });

// Main menu
const mainMenuOptions = {
  reply_markup: {
    inline_keyboard: [
      [{ text: 'List All Jobs', callback_data: 'list_all_jobs' }],
      [{ text: 'Customize Search', callback_data: 'customize_search' }],
      [{ text: 'Subscribe to Latest Job Updates', callback_data: 'subscribe_to_updates' }],
    
    ],
  },
};

// Customize search menu
const customizeSearchOptions = {
  reply_markup: {
    inline_keyboard: [
      [{ text: 'Set Salary Range', callback_data: 'set_salary_range' }],
      [{ text: 'Filter by Tech Stack', callback_data: 'filter_by_tech_stack' }],
      [{ text: 'Filter by Location', callback_data: 'filter_by_location' }],
      [{ text: 'Set Customized Job Alert', callback_data: 'set_customized_alert' }],

      [{ text: 'Back to Main Menu', callback_data: 'back_to_main_menu' }],
    ],
  },
};

bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, 'Welcome to the Job Search Bot! What would you like to do?', mainMenuOptions);
});

bot.on('callback_query', (callbackQuery) => {
  const data = callbackQuery.data;
  const chatId = callbackQuery.message.chat.id;

  switch (data) {
    case 'list_all_jobs':
      fetchAndDisplayAllJobs(chatId);
      break;
    case 'customize_search':
      bot.sendMessage(chatId, 'Great! Let\'s customize your job search. Choose an option:', customizeSearchOptions);
      break;
    case 'set_salary_range':
      bot.sendMessage(chatId, 'Enter minimum salary:');
      bot.once('text', (minSalary) => {
        bot.sendMessage(chatId, 'Enter maximum salary:');
        bot.once('text', (maxSalary) => {
          fetchAndDisplayJobsBySalaryRange(chatId, minSalary, maxSalary);
        });
      });
      break;
    case 'filter_by_tech_stack':
      bot.sendMessage(chatId, 'Choose from the suggested tech stacks or enter your own (comma-separated):', {
        reply_markup: {
          inline_keyboard: [
            [{ text: 'React JS', callback_data: 'tech_stack:ReactJS' }],
            [{ text: 'javascript', callback_data: 'tech_stack:javascript' }],
            [{ text: 'Node.js', callback_data: 'tech_stack:NodeJS' }],
            [{ text: 'Other', callback_data: 'tech_stack:Other' }],
          ],
        },
      });
      break;
    case 'filter_by_location':
      bot.sendMessage(chatId, 'Enter desired location (ISO code):');
      bot.once('text', (locationIso) => {
        fetchAndDisplayJobsByLocation(chatId, locationIso);
      });
      break;
    case 'back_to_main_menu':
      bot.sendMessage(chatId, 'Back to the main menu.', mainMenuOptions);
      break;
    case 'tech_stack:ReactJS':
    case 'tech_stack:javascript':
    case 'tech_stack:NodeJS':
    case 'tech_stack:Other':
      const techStack = data.split(':')[1];
      if (techStack === 'Other') {
        bot.sendMessage(chatId, 'Enter your desired technologies (comma-separated):');
        bot.once('text', (userTechnologies) => {
          fetchAndDisplayJobsByTechStack(chatId, userTechnologies);
        });
      } else {
        fetchAndDisplayJobsByTechStack(chatId, techStack);
      }
      break;
    default:
      break;
  }
});

// async function fetchAndDisplayAllJobs(chatId) {
//   console.log("Inside fetchAndDisplayAllJobs function");
//   try {
//     console.log("Before fetch call");
//     const response = await fetch(API_ENDPOINT, {
//       method: 'GET',
//       headers: {
//         'api-key': API_KEY,
//       },
//     });
//     const jobs = await response.json();
//     console.log("After fetch call");
//     console.log(jobs);

//     const jobList = jobs.map((job) => `${job.title} - ${job.company} - ${job.location}`).join('\n');
//     console.log(jobList);

//     bot.sendMessage(chatId, `Here are the available jobs:\n${jobList}`);
//   } catch (error) {
//     console.log("Error in fetchAndDisplayAllJobs:", error);
//     bot.sendMessage(chatId, 'Error fetching jobs. Please try again later.');
//   }
// }

async function fetchAndDisplayAllJobs(chatId) {
  console.log("Inside fetchAndDisplayAllJobs function");
  try {
    console.log("Before fetch call");
    const response = await fetch(API_ENDPOINT, {
      method: 'GET',
      headers: {
        'api-key': API_KEY,
      },
    });
    const jobs = await response.json();
    console.log("After fetch call");
    console.log(jobs);

    for (let job of jobs) {
      const shortDescription = job.description.split(' ').slice(0, 30).join(' ') + '...';
      const jobData = [
        // `**Title**: ${job.title}`,
        '*Title*: ' + job.title,
        `*Company *: ${job.company}`,
        `*Description*: **${shortDescription}**`,
        `*Views*: ${job.views}`,
        `*Minimum Salary(USD)*: ${job.min_salary_usd}`,
        `*Technologies*: ${job.technologies ? job.technologies.join(', ') : 'Not specified'}`,
        // `*Apply*: [${job.url}]`,
        `*Apply*: [${job.url}](${job.url})`,


      ].join('\n\n');

      
      // Then send job data
      bot.sendMessage(chatId, jobData, { parse_mode: 'Markdown' });
      // bot.sendMessage(chatId, jobData);
    }
  } catch (error) {
    console.log("Error in fetchAndDisplayAllJobs:", error);
    bot.sendMessage(chatId, 'Error fetching jobs. Please try again later.');
  }
}



async function fetchAndDisplayJobsBySalaryRange(chatId, minSalary, maxSalary) {
  try {
    const response = await fetch(`${API_ENDPOINT}?min_salary_usd=${minSalary}&max_salary_usd=${maxSalary}`, {
      method: 'GET',
      headers: {
        'api-key': API_KEY,
      },
    });
    // const jobs = await response.json();
    // const jobList = jobs.map((job) => `${job.title} - ${job.company} - ${job.location}`).join('\n');
    // console.log(jobList);

    // bot.sendMessage(chatId, `Here are the jobs in the specified salary range:\n${jobList}`);
    const jobs = await response.json();
    

    for (let job of jobs) {
      const shortDescription = job.description.split(' ').slice(0, 30).join(' ') + '...';
      const jobData = [
        // `**Title**: ${job.title}`,
        '*Title*: ' + job.title,
        `*Company *: ${job.company}`,
        `*Description*: **${shortDescription}**`,
        `*Views*: ${job.views}`,
        `*Minimum Salary(USD)*: ${job.min_salary_usd}`,
        `*Technologies*: ${job.technologies ? job.technologies.join(', ') : 'Not specified'}`,
        // `*Apply*: [${job.url}]`,
        `*Apply*: [${job.url}](${job.url})`,


      ].join('\n\n');

      
      // Then send job data
      bot.sendMessage(chatId, jobData, { parse_mode: 'Markdown' });
      // bot.sendMessage(chatId, jobData);
    }
  
  } catch (error) {
    bot.sendMessage(chatId, 'Error fetching jobs. Please try again later.');
  }
}



async function fetchAndDisplayJobsByTechStack(chatId, technologie) {
  try {
    const response = await fetch(`${API_ENDPOINT}?technologies=${technologie}`, {
      method: 'GET',
      headers: {
        'api-key': API_KEY,
      },
    });
    // const jobs = await response.json();
    // console.log(jobs);
    // const jobList = jobs.map((job) => `${job.title} - ${job.company} - ${job.location}`).join('\n');
    // console.log(jobList);
    const jobs = await response.json();
    

    for (let job of jobs) {
      const shortDescription = job.description.split(' ').slice(0, 30).join(' ') + '...';
      const jobData = [
        // `**Title**: ${job.title}`,
        '*Title*: ' + job.title,
        `*Company *: ${job.company}`,
        `*Description*: **${shortDescription}**`,
        `*Minimum Salary(USD)*: ${job.min_salary_usd}`,
        `*Views*: ${job.views}`,
        `*Technologies*: ${job.technologies ? job.technologies.join(', ') : 'Not specified'}`,
        // `*Apply*: [${job.url}]`,
        `*Apply*: [${job.url}](${job.url})`,


      ].join('\n\n');

      
      // Then send job data
      bot.sendMessage(chatId, jobData, { parse_mode: 'Markdown' });
      // bot.sendMessage(chatId, jobData);
    }
    // bot.sendMessage(chatId, `Here are the jobs in the specified techstack:\n${jobList}`);
  } catch (error) {
    bot.sendMessage(chatId, 'Error fetching jobs. Please try again later.');
  }
}
//   try {
//     const response = await fetch(`${API_ENDPOINT}?technologies=${technologies}`, {
//       method: 'GET',
//       headers: {
//         'api-key': API_KEY,
//       },
//     });

//     if (!response.ok) {
//       throw new Error(`HTTP error! Status: ${response.status}`);
//     }

//     const jobs = await response.json();

//     if (!Array.isArray(jobs)) {
//       throw new Error('Invalid response format or no jobs found');
//     }

//     if (jobs.length === 0) {
//       bot.sendMessage(chatId, 'No jobs found matching the specified technologies.');
//       return;
//     }

//     const jobList = jobs.map((job) => `${job.title} - ${job.company} - ${job.location}`).join('\n');
//     console.log(jobList);
//     bot.sendMessage(chatId, `Here are the jobs matching the specified technologies:\n${jobList}`);
//   } catch (error) {
//     console.error(error);
//     bot.sendMessage(chatId, 'Error fetching jobs. Please try again later.');
//   }
// }

// async function fetchAndDisplayJobsByTechStack(chatId, enteredTechnologies) {
//   try {
//     const response = await fetch(`${API_ENDPOINT}?technologies=${encodeURIComponent(enteredTechnologies)}`, {
//       method: 'GET',
//       headers: {
//         'api-key': API_KEY,
//       },
//     });

//     if (!response.ok) {
//       throw new Error(`HTTP error! Status: ${response.status}`);
//     }

//     const jobs = await response.json();

//     if (!Array.isArray(jobs)) {
//       throw new Error('Invalid response format or no jobs found');
//     }

//     if (jobs.length === 0) {
//       bot.sendMessage(chatId, `No jobs found matching the specified technologies.`);
//       return;
//     }

//     const jobList = jobs.map((job) => `${job.title} - ${job.company} - ${job.location}`).join('\n');
//     console.log(jobList);
//     bot.sendMessage(chatId, `Here are the jobs matching the specified technologies:\n${jobList}`);
//   } catch (error) {
//     console.error(error);
//     bot.sendMessage(chatId, 'Error fetching jobs. Please try again later.');
//   }
// }


// async function fetchAndDisplayJobsByTechStack(chatId, technologies) {
//   try {
//     const response = await fetch(`${API_ENDPOINT}?technologies=${technologies}`, {
//       method: 'GET',
//       headers: {
//         'api-key': API_KEY,
//       },
//     });

//     if (!response.ok) {
//       throw new Error(`HTTP error! Status: ${response.status}`);
//     }

//     const jobs = await response.json();

//     if (!jobs || !jobs.jobs || !Array.isArray(jobs.jobs)) {
//       throw new Error('Invalid response format or no jobs found');
//     }

//     if (jobs.jobs.length === 0) {
//       bot.sendMessage(chatId, 'No jobs found matching the specified technologies.');
//       return;
//     }

//     const jobList = jobs.map((job) => `${job.title} - ${job.company} - ${job.location}`).join('\n');
//     console.log(jobList);
//     bot.sendMessage(chatId, `Here are the jobs matching the specified technologies:\n${jobList}`);
//   } catch (error) {
//     console.error(error);
//     bot.sendMessage(chatId, 'Error fetching jobs. Please try again later.');
//   }
// }


async function fetchAndDisplayJobsByLocation(chatId, locationIso) {
  try {
    const response = await fetch(`${API_ENDPOINT}?location_iso=${locationIso}`, {
      method: 'GET',
      headers: {
        'api-key': API_KEY,
      },
    });
    const jobs = await response.json();
    const jobList = jobs.map((job) => `${job.title} - ${job.company} - ${job.location}`).join('\n');
    bot.sendMessage(chatId, `Here are the jobs in the specified location:\n${jobList}`);
  } catch (error) {

    bot.sendMessage(chatId, 'Error fetching jobs. Please try again later.');
  }
}


// ... (rest of the code remains the same)

// Main menu with subscribe option


// ... (rest of the code remains the same)

bot.on('callback_query', (callbackQuery) => {
  const data = callbackQuery.data;
  const chatId = callbackQuery.message.chat.id;

  switch (data) {
    // ... (other cases remain the same)
    case 'subscribe_to_updates':
      subscribeToJobUpdates(chatId);
      break;
    // ... (other cases remain the same)
  }
});

// Function to subscribe to job updates
function subscribeToJobUpdates(chatId) {
  // Save the user as subscribed (you might want to store this in a database)
  // For simplicity, let's assume there's a global array to store subscribed users
  subscribedUsers.push(chatId);

  bot.sendMessage(chatId, 'You have subscribed to the latest job updates. You will be notified when a new job is posted.');
}

// Keep track of subscribed users (you might want to use a database for this)
let subscribedUsers = [];

// Function to periodically check for new jobs and notify subscribed users
function checkForNewJobsAndNotify() {
  setInterval(async () => {
    try {
      const response = await fetch(API_ENDPOINT, {
        method: 'GET',
        headers: {
          'api-key': API_KEY,
        },
      });
      const jobs = await response.json();

      // Assuming jobs are sorted by timestamp in descending order
      const latestJob = jobs[0];

      // Check if there's a new job
      if (latestJob.timestamp > latestJobTimestamp) {
        // Notify all subscribed users
        notifySubscribedUsersAboutNewJob(latestJob);

        // Update the latest job timestamp
        latestJobTimestamp = latestJob.timestamp;
      }
    } catch (error) {
      console.error('Error checking for new jobs:', error);
    }
  }, 60000); // Check every 1 minute, adjust as needed
}

// Function to notify subscribed users about a new job
function notifySubscribedUsersAboutNewJob(job) {
  subscribedUsers.forEach((userId) => {
    bot.sendMessage(userId, `New job posted!\n${job.title} - ${job.company} - ${job.location}`);
  });
}



// Call the function to periodically check for new jobs and notify subscribed users
checkForNewJobsAndNotify();

// ... (rest of the code remains the same)




// ... (rest of the code remains the same)

bot.on('callback_query', (callbackQuery) => {
  const data = callbackQuery.data;
  const chatId = callbackQuery.message.chat.id;

  switch (data) {
    // ... (other cases remain the same)
    case 'set_customized_alert':
      setCustomizedJobAlert(chatId);
      break;
    // ... (other cases remain the same)
  }
});

// Function to set up customized job alert
function setCustomizedJobAlert(chatId) {
  bot.sendMessage(chatId, 'Enter your desired criteria for the customized job alert:');
  bot.sendMessage(chatId, 'Example: {"min_salary": 50000, "tech_stack": "ReactJS,NodeJS", "location": "US"}');
  bot.once('text', (criteria) => {
    // Save the user's customized job alert criteria (you might want to store this in a database)
    // For simplicity, let's assume there's a global object to store user-specific criteria
    customizedJobAlerts[chatId] = JSON.parse(criteria);

    bot.sendMessage(chatId, 'Customized job alert set successfully. You will be notified when a job matches your criteria.');
  });
}

// Keep track of customized job alerts for users (you might want to use a database for this)
let customizedJobAlerts = {};

// Function to periodically check for new jobs and notify users with customized job alerts
function checkForNewJobsAndNotifyCustomized() {
  setInterval(async () => {
    try {
      const response = await fetch(API_ENDPOINT, {
        method: 'GET',
        headers: {
          'api-key': API_KEY,
        },
      });
      const jobs = await response.json();

      // Check for each user's customized job alert criteria
      Object.keys(customizedJobAlerts).forEach((userId) => {
        const userCriteria = customizedJobAlerts[userId];

        // Filter jobs based on user's criteria
        const matchingJobs = jobs.filter(job =>
          (!userCriteria.min_salary || job.salary >= userCriteria.min_salary) &&
          (!userCriteria.tech_stack || job.tech_stack.includes(userCriteria.tech_stack)) &&
          (!userCriteria.location || job.location === userCriteria.location)
        );

        // Notify the user if there are matching jobs
        if (matchingJobs.length > 0) {
          notifyUserAboutCustomizedJobs(userId, matchingJobs);
        }
      });
    } catch (error) {
      console.error('Error checking for new jobs:', error);
    }
  }, 60000); // Check every 1 minute, adjust as needed
}

// Function to notify user about customized matching jobs
function notifyUserAboutCustomizedJobs(userId, matchingJobs) {
  const jobList = matchingJobs.map((job) => `${job.title} - ${job.company} - ${job.location}`).join('\n');
  bot.sendMessage(userId, `New jobs posted matching your criteria:\n${jobList}`);
}

// Call the function to periodically check for new jobs and notify users with customized job alerts
checkForNewJobsAndNotifyCustomized();

