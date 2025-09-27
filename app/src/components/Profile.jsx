import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { SideBar } from './SideBar';
import { PersonalData } from './PersonalData';
import { MyAds } from './MyAds';
import { Orders } from './Orders';
import Safety from './Safety';
import { NotificationList } from './NotificationList';
import { MyReviews } from './MyReviews';
import { Favorites } from './Favorites';

export const Profile = () => {
    return (
        <div style={{ marginBottom: 45, minHeight: '100vh', display: 'flex', alignItems: 'flex-start' }}>
            <SideBar/>
            <Routes>
                <Route path="/" element={<PersonalData />} />
                <Route path="/notifications" element={<NotificationList />} />
                <Route path="/favorites" element={<Favorites />} />
                <Route path="/my-ads" element={<MyAds />} />
                <Route path="/orders" element={<Orders />} />
                <Route path="/security" element={<Safety />} />
                <Route path="/reviews" element={<MyReviews />} />
            </Routes>
        </div>
    );
};
