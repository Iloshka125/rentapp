import { useState } from 'react';
/*import './index.css';*/
export const End = () => {
    return (
        <footer className="footer">
            <div className="footer-item address" style={{marginLeft: '1em'}}>
            <h2 className="footer-title" style={{fontWeight: '500', fontSize: '25px'}}>Адрес</h2>
            <p className="footer-text" style={{fontWeight: '400', fontSize: '20px'}}> Ростовская область, город <br /> 
                Таганрог, пер. Некрасовский, 42 </p>
            </div>


            <div className="footer-item contacts" style={{marginLeft: '0px'}}>
            <h2 className="footer-title" style={{fontWeight: '500', fontSize: '25px'}}>Контакты</h2>
            <p className="footer-text" style={{fontWeight: '400', fontSize: '20px'}}> +7 949 329 3960 <br />
                khachkovskii@sfedu.ru </p>



            </div>
            <div className="footer-item social" style={{marginLeft: '-1em'}}>
            <h2 className="footer-title">Социальные сети</h2>
            <div className="footer-icons" style={{gap: '24px'}}>
                    <img src="/wgt.svg" alt="WhatsApp" className="iconwatsup" />
                    <img src="/vk.svg" alt="VK" className="icon" />
                    <img src="/youtube.svg" alt="YouTube" className="icon" />
                    </div>
            </div>
        </footer>
    );
};