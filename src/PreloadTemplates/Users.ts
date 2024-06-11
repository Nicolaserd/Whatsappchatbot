const userPreload = {
    users: [
      {
       
        name: "John Doe",
        email: "john.doe@example.com",
        password: "hashedpassword123",
        phone: 123456789,
        country: "USA",
        address: "123 Main St",
        city: "New York",
        messages: [
          {
            
            content: "Hello, this is a test message."
          },
          {
           
            content: "This is another message."
          }
        ]
      },
      {
        
        name: "Jane Smith",
        email: "jane.smith@example.com",
        password: "hashedpassword456",
        phone: 987654321,
        country: "Canada",
        address: "456 Elm St",
        city: "Toronto",
        messages: [
          {
           
            content: "Hi, this is Jane's message."
          }
        ]
      }
    ]
  };

  export default userPreload;